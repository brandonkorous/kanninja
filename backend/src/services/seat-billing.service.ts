import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { clans, clanMembers } from '../db/schema/clans.js';
import { eq, and, sql } from 'drizzle-orm';
import { stripe } from '../config/stripe.js';
import { AppError } from '../utils/errors.js';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  type SubscriptionUsage,
} from '@kanninja/shared';
import { getOveragePriceId, isOveragePriceId } from '../config/stripe-prices.js';

/**
 * Seats are *unique people across owned clans*. A user has one subscription on
 * their profile and may own multiple clans (e.g. work + family + side project).
 * Seat count is the count of distinct clan_members.user_id where the clan was
 * created_by this user. The subscriber themselves counts as one seat (they're
 * a member of every clan they own).
 *
 * The same person appearing in two of my clans is one seat, not two.
 */
/** Snapshot of the owner's current seat usage relative to their tier.
 *  Used by the billing UI. seatsIncluded is null for Enterprise (custom).
 *  seatOveragePriceMonthly is null on tiers without overage (Free, Clan, Enterprise). */
export async function getSeatUsage(ownerId: string): Promise<SubscriptionUsage> {
  const [sub] = await db
    .select({ tier: subscriptions.subscriptionTier })
    .from(subscriptions)
    .where(eq(subscriptions.userId, ownerId))
    .limit(1);
  const tier = (sub?.tier ?? 'free') as SubscriptionTier;
  const config = SUBSCRIPTION_TIERS[tier];
  const seatsUsed = await countOwnedSeats(ownerId);
  const seatsIncluded =
    config.maxUsers === Number.POSITIVE_INFINITY ? null : config.maxUsers;
  const seatOverage =
    seatsIncluded === null ? 0 : Math.max(0, seatsUsed - seatsIncluded);
  return {
    seatsUsed,
    seatsIncluded,
    seatOverage,
    seatOveragePriceMonthly: config.seatOveragePrice,
  };
}

export async function countOwnedSeats(ownerId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(distinct ${clanMembers.userId})` })
    .from(clanMembers)
    .innerJoin(clans, eq(clans.id, clanMembers.clanId))
    .where(eq(clans.createdBy, ownerId));
  return Number(result[0]?.count ?? 0);
}

interface SubRow {
  subscriptionTier: string;
  subscribed: boolean;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeOverageSubscriptionItemId: string | null;
}

async function getSub(ownerId: string): Promise<SubRow | null> {
  const [sub] = await db
    .select({
      subscriptionTier: subscriptions.subscriptionTier,
      subscribed: subscriptions.subscribed,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripePriceId: subscriptions.stripePriceId,
      stripeOverageSubscriptionItemId: subscriptions.stripeOverageSubscriptionItemId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, ownerId))
    .limit(1);
  return sub ?? null;
}

/** True if the proposed new member would actually consume a new seat
 *  (i.e. they're not already in another clan owned by this user). */
async function wouldConsumeNewSeat(ownerId: string, newMemberId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: clanMembers.id })
    .from(clanMembers)
    .innerJoin(clans, eq(clans.id, clanMembers.clanId))
    .where(and(eq(clans.createdBy, ownerId), eq(clanMembers.userId, newMemberId)))
    .limit(1);
  return !existing;
}

/**
 * Throw if adding `newMemberId` to a clan owned by `ownerId` would push the
 * owner past their tier's seat cap on a hard-cap tier (Free, Clan).
 *
 * Tiers with seatOveragePrice (Pro, Business) accept overage and don't throw —
 * the caller should still call syncSeatOverageToStripe AFTER the insert to
 * update Stripe quantity.
 *
 * Call this BEFORE inserting the new clan_members row.
 */
export async function assertCanAddSeat(ownerId: string, newMemberId: string): Promise<void> {
  // If this person is already in another of the owner's clans, no new seat
  // is consumed — allow regardless of cap.
  if (!(await wouldConsumeNewSeat(ownerId, newMemberId))) return;

  const sub = await getSub(ownerId);
  const tier = (sub?.subscriptionTier ?? 'free') as SubscriptionTier;
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config) return;

  // Hard-cap tiers reject when the new seat would exceed maxUsers.
  // Overage tiers (seatOveragePrice != null) and Enterprise (Infinity) pass through.
  if (config.seatOveragePrice !== null) return;
  if (config.maxUsers === Number.POSITIVE_INFINITY) return;

  const currentSeats = await countOwnedSeats(ownerId);
  if (currentSeats + 1 > config.maxUsers) {
    throw AppError.subscriptionRequired(
      `Your ${config.name} plan allows ${config.maxUsers} seats. Upgrade to add more.`,
    );
  }
}

/**
 * Recompute the owner's unique seat count and update the Stripe subscription's
 * seat-overage line item to match. Idempotent — safe to call after every
 * member add/remove.
 *
 * No-ops when:
 *   - The owner has no Stripe subscription (Free or Enterprise tier).
 *   - The owner's tier doesn't support overage (Free, Clan, Enterprise).
 *
 * Creates the overage subscription item on first overage; updates its quantity
 * thereafter; deletes it when seats drop back to or below the included quota.
 */
export async function syncSeatOverageToStripe(ownerId: string): Promise<void> {
  const sub = await getSub(ownerId);
  if (!sub || !sub.subscribed || !sub.stripeSubscriptionId || !sub.stripePriceId) return;

  const tier = sub.subscriptionTier as SubscriptionTier;
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config || config.seatOveragePrice === null) return;

  const seats = await countOwnedSeats(ownerId);
  const overage = Math.max(0, seats - config.maxUsers);

  // Determine billing interval from the base price ID. Cheapest reliable way:
  // fetch the Stripe subscription and read the base item's price.recurring.interval.
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
    expand: ['items.data.price'],
  });
  const baseItem = stripeSub.items.data.find((i) => i.price.id === sub.stripePriceId);
  const interval = baseItem?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  const overagePriceId = getOveragePriceId(tier, interval);
  if (!overagePriceId) return;

  const existingOverageItem = stripeSub.items.data.find(
    (i) => i.price.id && isOveragePriceId(i.price.id),
  );

  if (overage === 0) {
    if (existingOverageItem) {
      // Drop the overage line entirely. Stripe will prorate a credit on next invoice.
      await stripe.subscriptionItems.del(existingOverageItem.id);
      await db
        .update(subscriptions)
        .set({ stripeOverageSubscriptionItemId: null, updatedAt: new Date() })
        .where(eq(subscriptions.userId, ownerId));
    }
    return;
  }

  if (existingOverageItem) {
    if (existingOverageItem.quantity !== overage) {
      await stripe.subscriptionItems.update(existingOverageItem.id, { quantity: overage });
    }
    if (sub.stripeOverageSubscriptionItemId !== existingOverageItem.id) {
      await db
        .update(subscriptions)
        .set({ stripeOverageSubscriptionItemId: existingOverageItem.id, updatedAt: new Date() })
        .where(eq(subscriptions.userId, ownerId));
    }
    return;
  }

  // First-time overage: add the new subscription item.
  const created = await stripe.subscriptionItems.create({
    subscription: sub.stripeSubscriptionId,
    price: overagePriceId,
    quantity: overage,
  });
  await db
    .update(subscriptions)
    .set({ stripeOverageSubscriptionItemId: created.id, updatedAt: new Date() })
    .where(eq(subscriptions.userId, ownerId));
}

/**
 * Iterate every active paid subscription and re-sync its overage to Stripe.
 * Safety net for the rare case where a request-time sync silently failed
 * (Stripe outage, transient error). Continues on per-row failure and returns
 * a summary; intended to run from a scheduled job (e.g. K8s CronJob).
 */
export async function reconcileAllSubscriptions(): Promise<{
  processed: number;
  failed: number;
  failures: Array<{ userId: string; error: string }>;
}> {
  const rows = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.subscribed, true));

  const failures: Array<{ userId: string; error: string }> = [];
  for (const row of rows) {
    try {
      await syncSeatOverageToStripe(row.userId);
    } catch (err) {
      failures.push({
        userId: row.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { processed: rows.length, failed: failures.length, failures };
}

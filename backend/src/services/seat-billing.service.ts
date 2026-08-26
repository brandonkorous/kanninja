import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { clans, clanMembers } from '../db/schema/clans.js';
import { eq, and, sql } from 'drizzle-orm';
import { stripe } from '../config/stripe.js';
import { AppError } from '../utils/errors.js';
import {
  SUBSCRIPTION_TIERS,
  getSeatCap,
  getMinSeats,
  billableSeats,
  isPerSeat,
  normalizeTier,
  type SubscriptionUsage,
} from '@kanninja/shared';
import { isBasePriceId, isPerSeatPriceId } from '../config/stripe-prices.js';

/**
 * Seats are *unique people across owned clans*. A user has one subscription on
 * their profile and may own multiple clans (e.g. work + family + side project).
 * Seat count is the count of distinct clan_members.user_id where the clan was
 * created_by this user. The subscriber themselves counts as one seat (they're
 * a member of every clan they own).
 *
 * The same person appearing in two of my clans is one seat, not two.
 */
/** Snapshot of the owner's seat position, for the billing UI.
 *
 *  `seatCap` is non-null only on the tiers that still refuse a 16th person
 *  (Free, Clan). On a per-seat tier there is no cap — the next seat is another
 *  line on the invoice — so the UI must show a PRICE there, never a limit.
 *  `seatsBilled` is what Stripe's quantity should be, which on Business is the
 *  5-seat minimum even when three people are using it. */
export async function getSeatUsage(ownerId: string): Promise<SubscriptionUsage> {
  const [sub] = await db
    .select({ tier: subscriptions.subscriptionTier })
    .from(subscriptions)
    .where(eq(subscriptions.userId, ownerId))
    .limit(1);
  const tier = normalizeTier(sub?.tier);
  const config = SUBSCRIPTION_TIERS[tier];
  const seatsUsed = await countOwnedSeats(ownerId);
  const pricing = config.pricing;

  return {
    seatsUsed,
    seatCap: getSeatCap(tier),
    seatsBilled: billableSeats(tier, seatsUsed),
    minSeats: getMinSeats(tier),
    perSeatPriceMonthly: pricing.model === 'per_seat' ? pricing.monthly : null,
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
}

async function getSub(ownerId: string): Promise<SubRow | null> {
  const [sub] = await db
    .select({
      subscriptionTier: subscriptions.subscriptionTier,
      subscribed: subscriptions.subscribed,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripePriceId: subscriptions.stripePriceId,
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
 * Throw if adding `newMemberId` would push the owner past a HARD seat cap.
 *
 * Only Free and Clan have one. Per-seat tiers pass through: another seat is
 * billable, not forbidden, and the caller must still run
 * syncSeatQuantityToStripe AFTER the insert so Stripe's quantity follows.
 *
 * Call this BEFORE inserting the new clan_members row.
 */
export async function assertCanAddSeat(ownerId: string, newMemberId: string): Promise<void> {
  // Already in another clan this owner runs? Then no new seat is consumed and
  // the cap is irrelevant.
  if (!(await wouldConsumeNewSeat(ownerId, newMemberId))) return;

  const sub = await getSub(ownerId);
  const tier = normalizeTier(sub?.subscriptionTier);
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config) return;

  const cap = getSeatCap(tier);
  if (cap === null) return;

  const currentSeats = await countOwnedSeats(ownerId);
  if (currentSeats + 1 > cap) {
    throw AppError.subscriptionRequired(
      `Your ${config.name} plan allows ${cap} seats. Upgrade to add more.`,
    );
  }
}

/**
 * Point Stripe's seat quantity at reality.
 *
 * Per-seat tiers bill the BASE subscription item with quantity = billable
 * seats, so there is one line and one number to keep honest. This replaces the
 * old separate seat-overage item, which only existed because a flat bundle
 * needed somewhere to put the 16th seat.
 *
 * Idempotent — safe after every member add or remove.
 *
 * No-ops when the owner has no Stripe subscription (Free, Enterprise) or is on
 * a flat tier (Clan), where quantity is always 1.
 */
export async function syncSeatQuantityToStripe(ownerId: string): Promise<void> {
  const sub = await getSub(ownerId);
  if (!sub || !sub.subscribed || !sub.stripeSubscriptionId || !sub.stripePriceId) return;

  const tier = normalizeTier(sub.subscriptionTier);
  if (!isPerSeat(tier)) return;

  // Refuse to touch a subscription still sitting on a legacy FLAT price. Those
  // are per-unit too, so setting quantity would bill N x the whole bundle
  // rather than N seats — the $25 Pro price would become $25 a head. Such a
  // subscription must be moved onto a per-seat price before its seats can sync.
  if (!isPerSeatPriceId(sub.stripePriceId)) return;

  const seats = await countOwnedSeats(ownerId);
  const quantity = billableSeats(tier, seats);

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId, {
    expand: ['items.data.price'],
  });

  // Match on the configured base price rather than "the first item": a
  // subscription migrated from the flat model can still carry a stale overage
  // item, and updating that one instead would bill seats at the overage rate.
  const baseItem =
    stripeSub.items.data.find((i) => i.price.id === sub.stripePriceId) ??
    stripeSub.items.data.find((i) => i.price.id && isBasePriceId(i.price.id));
  if (!baseItem) return;

  if (baseItem.quantity !== quantity) {
    await stripe.subscriptionItems.update(baseItem.id, { quantity });
  }
}

/**
 * Iterate every active paid subscription and re-sync its seat quantity.
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
      await syncSeatQuantityToStripe(row.userId);
    } catch (err) {
      failures.push({
        userId: row.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { processed: rows.length, failed: failures.length, failures };
}

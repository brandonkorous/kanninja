import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { aiInteractions } from '../db/schema/analytics.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  type AIQuotaStatus,
} from '@kanninja/shared';

/** Start of the current UTC calendar month — the boundary for monthly quotas. */
function startOfThisMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** First of next UTC calendar month — when a monthly quota resets. */
function startOfNextMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const [sub] = await db
    .select({ tier: subscriptions.subscriptionTier })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return (sub?.tier ?? 'free') as SubscriptionTier;
}

async function countInteractionsSince(userId: string, since: Date | null): Promise<number> {
  const where = since
    ? and(eq(aiInteractions.userId, userId), gte(aiInteractions.createdAt, since))
    : eq(aiInteractions.userId, userId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiInteractions)
    .where(where);
  return Number(row?.count ?? 0);
}

/**
 * Snapshot of a user's AI run consumption for the billing UI and the
 * pre-call quota gate. Lifetime window for Free, monthly for Clan/Pro/Business,
 * unlimited for Enterprise.
 */
export async function getAIQuotaStatus(userId: string): Promise<AIQuotaStatus> {
  const tier = await getUserTier(userId);
  const config = SUBSCRIPTION_TIERS[tier];

  // Enterprise (and any future tier with both fields null) = unlimited.
  if (config.features.aiRunsLifetime === null && config.features.aiRunsPerMonth === null) {
    const used = await countInteractionsSince(userId, null);
    return {
      tier,
      windowKind: 'unlimited',
      used,
      limit: null,
      remaining: null,
      resetsAt: null,
    };
  }

  // Free uses a lifetime quota — counts all interactions ever, never resets.
  if (config.features.aiRunsLifetime !== null) {
    const used = await countInteractionsSince(userId, null);
    const limit = config.features.aiRunsLifetime;
    return {
      tier,
      windowKind: 'lifetime',
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsAt: null,
    };
  }

  // Otherwise monthly — counts interactions since the start of the current UTC month.
  const used = await countInteractionsSince(userId, startOfThisMonthUTC());
  const limit = config.features.aiRunsPerMonth ?? 0;
  return {
    tier,
    windowKind: 'monthly',
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: startOfNextMonthUTC().toISOString(),
  };
}

/**
 * Throw before processing an AI request when the user has hit their cap.
 * Call from a route preHandler. No-op for unlimited tiers.
 *
 * Race note: two concurrent requests can both pass the pre-check before
 * either has been logged. Acceptable for low volume; revisit with row-level
 * locking or a Redis counter if abuse becomes a thing.
 */
export async function assertWithinAIQuota(userId: string): Promise<void> {
  const status = await getAIQuotaStatus(userId);
  if (status.limit === null) return;
  if (status.used >= status.limit) {
    const tierName = SUBSCRIPTION_TIERS[status.tier as SubscriptionTier].name;
    const window =
      status.windowKind === 'lifetime' ? 'on the Free tier' : 'this month';
    throw AppError.subscriptionRequired(
      `You've used all ${status.limit} AI runs ${window} on ${tierName}. Upgrade to add more.`,
    );
  }
}

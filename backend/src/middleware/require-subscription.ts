import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { type SubscriptionTier, SUBSCRIPTION_TIERS } from '@kanninja/shared';

const TIER_ORDER: Record<string, number> = {
  free: 0,
  essentials: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
};

export function requireSubscription(minTier: SubscriptionTier) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    const userId = request.profileId;
    if (!userId) throw AppError.unauthorized();

    const [sub] = await db
      .select({
        tier: subscriptions.subscriptionTier,
        subscribed: subscriptions.subscribed,
        subscriptionEnd: subscriptions.subscriptionEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const currentTier = sub?.tier ?? 'free';
    const userLevel = TIER_ORDER[currentTier] ?? 0;
    const requiredLevel = TIER_ORDER[minTier] ?? 0;

    if (userLevel < requiredLevel) {
      const tierConfig = SUBSCRIPTION_TIERS[minTier];
      throw AppError.tierInsufficient(tierConfig.name);
    }
  };
}

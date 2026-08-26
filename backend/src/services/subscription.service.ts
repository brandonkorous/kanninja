import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { profiles } from '../db/schema/profiles.js';
import { stripe } from '../config/stripe.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { SubscriptionTier, isPerSeat, billableSeats } from '@kanninja/shared';
import { env } from '../config/env.js';
import { getBasePriceId, tierFromPriceId, isBasePriceId } from '../config/stripe-prices.js';
import { countOwnedSeats } from './seat-billing.service.js';

export const subscriptionService = {
  async getSubscription(userId: string) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!sub) {
      // Return default free tier
      return {
        userId,
        subscribed: false,
        subscriptionTier: 'free' as const,
        subscriptionEnd: null,
      };
    }

    return sub;
  },

  async checkAndSyncFromStripe(userId: string, email: string) {
    if (!env.STRIPE_SECRET_KEY) {
      // Stripe not configured — just ensure free tier exists
      return this.upsertFreeTier(userId, email);
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return this.upsertFreeTier(userId, email);
    }

    const customer = customers.data[0];
    const stripeSubs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (stripeSubs.data.length === 0) {
      await db
        .insert(subscriptions)
        .values({
          userId,
          email,
          stripeCustomerId: customer.id,
          subscribed: false,
          subscriptionTier: 'free',
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            stripeCustomerId: customer.id,
            subscribed: false,
            subscriptionTier: 'free',
            subscriptionEnd: null,
            updatedAt: new Date(),
          },
        });
      return this.getSubscription(userId);
    }

    const sub = stripeSubs.data[0];
    // Map the tier off the base item. A subscription migrated from the flat
    // model can still carry a stale overage item, so falling back to
    // items.data[0] is a last resort rather than the normal path.
    const baseItem = sub.items.data.find((i) => isBasePriceId(i.price.id));
    const basePriceId = baseItem?.price.id ?? sub.items.data[0]?.price.id;
    const tier = basePriceId ? tierFromPriceId(basePriceId) : 'free';
    const periodEnd = (sub as { current_period_end?: number }).current_period_end;
    const subscriptionEnd = periodEnd ? new Date(periodEnd * 1000) : null;

    await db
      .insert(subscriptions)
      .values({
        userId,
        email,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: basePriceId,
        subscribed: true,
        subscriptionTier: tier,
        subscriptionEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: sub.id,
          stripePriceId: basePriceId,
            subscribed: true,
          subscriptionTier: tier,
          subscriptionEnd,
          updatedAt: new Date(),
        },
      });

    return this.getSubscription(userId);
  },

  async upsertFreeTier(userId: string, email: string) {
    await db
      .insert(subscriptions)
      .values({
        userId,
        email,
        subscribed: false,
        subscriptionTier: 'free',
      })
      .onConflictDoNothing();
    return this.getSubscription(userId);
  },

  async createCheckoutSession(input: {
    userId: string;
    tier: SubscriptionTier;
    interval: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
  }) {
    if (!env.STRIPE_SECRET_KEY) {
      throw AppError.validationError('Stripe is not configured');
    }

    if (input.tier === SubscriptionTier.FREE) {
      throw AppError.validationError('Invalid tier for checkout');
    }
    // Throws with a message naming the missing price rather than handing
    // Stripe an empty string.
    const priceId = getBasePriceId(input.tier, input.interval);

    // Per-seat tiers check out for the seats the buyer already has, floored at
    // the tier minimum — Business is a 5-seat product even on day one. Flat
    // tiers are always quantity 1. Getting this wrong in either direction bills
    // the wrong amount from the first invoice, so it is computed, not assumed.
    const seatsUsed = await countOwnedSeats(input.userId);
    const quantity = isPerSeat(input.tier)
      ? Math.max(billableSeats(input.tier, seatsUsed), 1)
      : 1;

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, input.userId))
      .limit(1);
    if (!profile) throw AppError.notFound('Profile');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: profile.email,
      line_items: [{ price: priceId, quantity }],
      allow_promotion_codes: true,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId, tier: input.tier, seats: String(quantity) },
    });

    return { url: session.url };
  },

  async createPortalSession(userId: string, returnUrl: string) {
    const sub = await this.getSubscription(userId);
    if (!('stripeCustomerId' in sub) || !sub.stripeCustomerId) {
      throw AppError.notFound('Stripe customer');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  },
};

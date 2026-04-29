import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { profiles } from '../db/schema/profiles.js';
import { stripe } from '../config/stripe.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { SubscriptionTier } from '@kanninja/shared';
import { env } from '../config/env.js';
import { STRIPE_PRICE_IDS, tierFromPriceId, isBasePriceId, isOveragePriceId } from '../config/stripe-prices.js';

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
    // Pick the BASE item (not the seat-overage item) when mapping tier.
    const baseItem = sub.items.data.find((i) => isBasePriceId(i.price.id));
    const overageItem = sub.items.data.find((i) => isOveragePriceId(i.price.id));
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
        stripeOverageSubscriptionItemId: overageItem?.id ?? null,
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
          stripeOverageSubscriptionItemId: overageItem?.id ?? null,
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
    if (input.tier === SubscriptionTier.ENTERPRISE) {
      throw AppError.validationError('Enterprise is sales-only — contact us instead of self-serve checkout');
    }

    const priceId = STRIPE_PRICE_IDS[input.tier]?.base[input.interval];
    if (!priceId) {
      throw AppError.validationError('Invalid tier/interval combination');
    }

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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId, tier: input.tier },
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

import { FastifyInstance } from 'fastify';
import { stripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { subscriptions } from '../../db/schema/subscriptions.js';
import { profiles } from '../../db/schema/profiles.js';
import { stripeWebhookEvents } from '../../db/schema/stripe-events.js';
import { eq } from 'drizzle-orm';
import { tierFromPriceId, isBasePriceId } from '../../config/stripe-prices.js';
import type Stripe from 'stripe';

export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/api/webhooks/stripe', { config: { rawBody: true } }, async (request, reply) => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: 'Stripe webhooks not configured' });
    }

    const sig = request.headers['stripe-signature'] as string;
    if (!sig) return reply.status(400).send({ error: 'Missing signature' });

    // Must verify against the exact bytes Stripe signed. request.rawBody is
    // captured by fastify-raw-body for this route (config.rawBody above); a
    // re-serialized request.body fails verification.
    const rawBody = request.rawBody;
    if (!rawBody) {
      request.log.error('Stripe webhook: raw body unavailable — fastify-raw-body misconfigured');
      return reply.status(400).send({ error: 'Raw body unavailable' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return reply.status(400).send({ error: `Webhook error: ${(err as Error).message}` });
    }

    // Deduplicate — if we've already processed this event, return early
    const [existing] = await db
      .select({ id: stripeWebhookEvents.id })
      .from(stripeWebhookEvents)
      .where(eq(stripeWebhookEvents.stripeEventId, event.id))
      .limit(1);

    if (existing) {
      return reply.status(200).send({ received: true, deduplicated: true });
    }

    // Store the event
    const [inserted] = await db
      .insert(stripeWebhookEvents)
      .values({
        stripeEventId: event.id,
        eventType: event.type,
        payload: event.data.object as unknown as Record<string, unknown>,
      })
      .returning({ id: stripeWebhookEvents.id });

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          // Locks in the user→Stripe-customer mapping at the moment Checkout
          // finishes, before the customer.subscription.created event arrives.
          // We set metadata.userId during checkout creation (see
          // subscription.service.ts:createCheckoutSession), so this handler
          // doesn't have to fall back to email matching. The tier itself is
          // filled in by the subsequent subscription.created event.
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
          if (!userId || !customerId) {
            request.log.warn(
              { sessionId: session.id, hasUserId: !!userId, hasCustomer: !!customerId },
              'checkout.session.completed missing metadata.userId or customer',
            );
            break;
          }
          // Need the user's email to satisfy the NOT NULL on subscriptions.email.
          // The row may not exist yet if this user never visited a route that
          // upserts a free-tier row (e.g. signed up and went straight to checkout).
          const [profile] = await db
            .select({ email: profiles.email })
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);
          if (!profile) {
            request.log.warn({ userId }, 'checkout.session.completed: profile not found');
            break;
          }
          await db
            .insert(subscriptions)
            .values({
              userId,
              email: profile.email,
              stripeCustomerId: customerId,
              subscribed: false, // flipped true by subscription.created/updated
              subscriptionTier: 'free',
            })
            .onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                stripeCustomerId: customerId,
                updatedAt: new Date(),
              },
            });
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
          // Seats ride the base item's quantity now, so tier comes off that
          // item alone. A subscription migrated from the flat model may still
          // carry a stale overage item; it is ignored rather than matched.
          const baseItem = sub.items.data.find((i) => i.price?.id && isBasePriceId(i.price.id));
          const basePriceId = baseItem?.price?.id;
          const tier = basePriceId ? tierFromPriceId(basePriceId) : 'free';
          const periodEnd = (sub as { current_period_end?: number }).current_period_end;
          await db
            .update(subscriptions)
            .set({
              subscribed: sub.status === 'active',
              subscriptionTier: tier,
              stripeSubscriptionId: sub.id,
              stripePriceId: basePriceId ?? null,
              subscriptionEnd: periodEnd ? new Date(periodEnd * 1000) : null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeCustomerId, customerId));
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
          await db
            .update(subscriptions)
            .set({
              subscribed: false,
              subscriptionTier: 'free',
              stripeSubscriptionId: null,
              stripePriceId: null,
              subscriptionEnd: null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeCustomerId, customerId));
          break;
        }
      }

      // Mark as processed
      await db
        .update(stripeWebhookEvents)
        .set({ status: 'processed' })
        .where(eq(stripeWebhookEvents.id, inserted.id));
    } catch (err) {
      // Mark as failed with error detail
      await db
        .update(stripeWebhookEvents)
        .set({ status: 'failed', error: (err as Error).message })
        .where(eq(stripeWebhookEvents.id, inserted.id));
      throw err;
    }

    return reply.status(200).send({ received: true });
  });
}

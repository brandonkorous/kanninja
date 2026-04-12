import { FastifyInstance } from 'fastify';
import { stripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { subscriptions } from '../../db/schema/subscriptions.js';
import { stripeWebhookEvents } from '../../db/schema/stripe-events.js';
import { eq } from 'drizzle-orm';
import { tierFromPriceId } from '../../config/stripe-prices.js';
import type Stripe from 'stripe';

export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/api/webhooks/stripe', async (request, reply) => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(503).send({ error: 'Stripe webhooks not configured' });
    }

    const sig = request.headers['stripe-signature'] as string;
    if (!sig) return reply.status(400).send({ error: 'Missing signature' });

    let event: Stripe.Event;
    try {
      const rawBody = JSON.stringify(request.body);
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
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
          const priceId = sub.items.data[0]?.price?.id;
          const tier = priceId ? tierFromPriceId(priceId) : 'free';
          const periodEnd = (sub as { current_period_end?: number }).current_period_end;
          await db
            .update(subscriptions)
            .set({
              subscribed: sub.status === 'active',
              subscriptionTier: tier,
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId ?? null,
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

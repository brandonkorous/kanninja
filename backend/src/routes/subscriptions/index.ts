import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { subscriptionService } from '../../services/subscription.service.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { createCheckoutSchema, SubscriptionTier } from '@kanninja/shared';

const portalSchema = z.object({ returnUrl: z.string().url() });

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Get current user's subscription (and sync from Stripe)
  fastify.get(
    '/api/v1/subscription',
    { preHandler: [requireAuth] },
    async (request) => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, request.profileId!))
        .limit(1);
      if (!profile) throw AppError.notFound('Profile');

      const sub = await subscriptionService.checkAndSyncFromStripe(request.profileId!, profile.email);
      return { data: sub };
    },
  );

  // Create checkout session
  fastify.post(
    '/api/v1/subscription/checkout',
    { preHandler: [requireAuth] },
    async (request) => {
      const input = createCheckoutSchema.parse(request.body);
      const result = await subscriptionService.createCheckoutSession({
        userId: request.profileId!,
        tier: input.tier as SubscriptionTier,
        interval: input.interval,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });
      return { data: result };
    },
  );

  // Customer portal
  fastify.post(
    '/api/v1/subscription/portal',
    { preHandler: [requireAuth] },
    async (request) => {
      const input = portalSchema.parse(request.body);
      const result = await subscriptionService.createPortalSession(
        request.profileId!,
        input.returnUrl,
      );
      return { data: result };
    },
  );

  // Select free plan (no Stripe needed)
  fastify.post(
    '/api/v1/subscription/select-free',
    { preHandler: [requireAuth] },
    async (request) => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, request.profileId!))
        .limit(1);
      if (!profile) throw AppError.notFound('Profile');

      const sub = await subscriptionService.upsertFreeTier(request.profileId!, profile.email);
      return { data: sub };
    },
  );
}

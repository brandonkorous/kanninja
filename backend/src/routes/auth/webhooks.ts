import { FastifyInstance } from 'fastify';
import { Webhook } from 'svix';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq } from 'drizzle-orm';

interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
}

export async function clerkWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/api/webhooks/clerk', {
    config: { rawBody: true },
    handler: async (request, reply) => {
      const svixId = request.headers['svix-id'] as string;
      const svixTimestamp = request.headers['svix-timestamp'] as string;
      const svixSignature = request.headers['svix-signature'] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        return reply.status(400).send({ error: 'Missing svix headers' });
      }

      // svix verifies the signature against the raw payload bytes — captured by
      // fastify-raw-body (config.rawBody below). A re-serialized request.body
      // won't match.
      const rawBody = request.rawBody;
      if (!rawBody) {
        request.log.error('Clerk webhook: raw body unavailable — fastify-raw-body misconfigured');
        return reply.status(400).send({ error: 'Raw body unavailable' });
      }

      const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
      let payload: ClerkWebhookPayload;

      try {
        payload = wh.verify(rawBody, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }) as ClerkWebhookPayload;
      } catch {
        return reply.status(400).send({ error: 'Invalid webhook signature' });
      }

      const { type, data } = payload;
      const primaryEmail = data.email_addresses?.[0]?.email_address;
      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

      switch (type) {
        case 'user.created': {
          // Provisioning moved to Better Auth's sign-up hook (see lib/auth.ts
          // → databaseHooks.user.create.after). A profile now requires an
          // auth_users row, which a Clerk-only signup doesn't have.
          //
          // Clerk sign-ups are frozen for the migration window, so reaching
          // here means a straggler slipped through. Log it loudly rather than
          // failing: the delta run of migrate-clerk-users.ts picks these up,
          // and returning non-2xx would just make Clerk retry forever.
          request.log.warn(
            { clerkUserId: data.id, email: primaryEmail },
            'Clerk user.created received after Better Auth cutover — not provisioned. ' +
              'Re-run migrate-clerk-users.ts to import this user.',
          );
          break;
        }

        case 'user.updated': {
          await db
            .update(profiles)
            .set({
              email: primaryEmail,
              displayName,
              avatarUrl: data.image_url,
              updatedAt: new Date(),
            })
            .where(eq(profiles.clerkUserId, data.id));
          break;
        }

        case 'user.deleted': {
          await db.delete(profiles).where(eq(profiles.clerkUserId, data.id));
          break;
        }
      }

      return reply.status(200).send({ received: true });
    },
  });
}

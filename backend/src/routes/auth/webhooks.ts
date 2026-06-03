import { FastifyInstance } from 'fastify';
import { Webhook } from 'svix';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { clans, clanMembers } from '../../db/schema/clans.js';
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

// Name the personal clan after the user's first name (or email
// local-part as a fallback). The user can rename it anytime — this is
// just a sensible default so it doesn't show up as "Untitled clan".
function personalClanName(displayName: string | null, email: string): string {
  if (displayName && displayName.trim()) {
    const first = displayName.trim().split(/\s+/)[0];
    return `${first}'s clan`;
  }
  const local = email.split('@')[0];
  return `${local}'s clan`;
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
          if (!primaryEmail) break;
          // Wrap profile + personal-clan creation in a single transaction
          // so we never end up with a profile that has no personal clan
          // (which would strand the user with no default "home" for
          // their boards). If any step fails, Clerk retries the webhook.
          await db.transaction(async (tx) => {
            const [profile] = await tx
              .insert(profiles)
              .values({
                clerkUserId: data.id,
                email: primaryEmail,
                displayName,
                avatarUrl: data.image_url,
              })
              .returning();

            const [personalClan] = await tx
              .insert(clans)
              .values({
                name: personalClanName(displayName, primaryEmail),
                createdBy: profile.id,
                isPersonal: true,
              })
              .returning();

            await tx.insert(clanMembers).values({
              clanId: personalClan.id,
              userId: profile.id,
              role: 'admin',
            });
          });
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

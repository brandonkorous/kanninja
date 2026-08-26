import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireClanRole } from '../../middleware/require-clan-role.js';
import { db } from '../../db/index.js';
import { clans, clanInvitations, clanMembers } from '../../db/schema/clans.js';
import { profiles } from '../../db/schema/profiles.js';
import { AppError } from '../../utils/errors.js';
import {
  assertCanAddSeat,
  syncSeatQuantityToStripe,
} from '../../services/seat-billing.service.js';

const inviteClanSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'reader']).default('member'),
});

function generateToken() {
  return randomBytes(32).toString('hex');
}

function expiryDate(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function clanInvitationRoutes(fastify: FastifyInstance) {
  // Create a clan invitation — only clan admins can invite.
  fastify.post<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId/invitations',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request, reply) => {
      const input = inviteClanSchema.parse(request.body);
      const [inv] = await db
        .insert(clanInvitations)
        .values({
          clanId: request.params.clanId,
          email: input.email,
          role: input.role,
          inviteToken: generateToken(),
          invitedBy: request.profileId!,
          expiresAt: expiryDate(),
        })
        .returning();
      return reply.status(201).send({ data: inv });
    },
  );

  // Look up a clan invitation by token. Public so the landing page can
  // render the clan name before sign-in — joining clans so the frontend
  // can tell the user which clan they're being invited into.
  fastify.get<{ Params: { token: string } }>(
    '/api/v1/clan-invitations/:token',
    async (request) => {
      const [inv] = await db
        .select({
          id: clanInvitations.id,
          clanId: clanInvitations.clanId,
          email: clanInvitations.email,
          role: clanInvitations.role,
          inviteToken: clanInvitations.inviteToken,
          expiresAt: clanInvitations.expiresAt,
          acceptedAt: clanInvitations.acceptedAt,
          clanName: clans.name,
        })
        .from(clanInvitations)
        .innerJoin(clans, eq(clans.id, clanInvitations.clanId))
        .where(eq(clanInvitations.inviteToken, request.params.token))
        .limit(1);

      if (!inv) throw AppError.notFound('Invitation');
      if (inv.acceptedAt) throw AppError.conflict('Invitation already accepted');
      if (new Date() > inv.expiresAt) throw AppError.forbidden('Invitation expired');

      return { data: { kind: 'clan' as const, ...inv } };
    },
  );

  // Accept a clan invitation — same email-match gate and idempotent add
  // as the board flow.
  fastify.post<{ Params: { token: string } }>(
    '/api/v1/clan-invitations/:token/accept',
    { preHandler: [requireAuth] },
    async (request) => {
      const [inv] = await db
        .select()
        .from(clanInvitations)
        .where(eq(clanInvitations.inviteToken, request.params.token))
        .limit(1);

      if (!inv) throw AppError.notFound('Invitation');
      if (inv.acceptedAt) throw AppError.conflict('Invitation already accepted');
      if (new Date() > inv.expiresAt) throw AppError.forbidden('Invitation expired');

      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, request.profileId!))
        .limit(1);

      if (profile?.email !== inv.email) {
        throw AppError.forbidden('This invitation was sent to a different email');
      }

      const [existing] = await db
        .select()
        .from(clanMembers)
        .where(
          and(
            eq(clanMembers.clanId, inv.clanId),
            eq(clanMembers.userId, request.profileId!),
          ),
        )
        .limit(1);

      // The seat-paying owner is the clan creator, not the inviter — a
      // non-creator admin may have sent the invite, but billing follows
      // ownership.
      const [clan] = await db
        .select({ createdBy: clans.createdBy })
        .from(clans)
        .where(eq(clans.id, inv.clanId))
        .limit(1);
      if (!clan) throw AppError.notFound('Clan');

      if (!existing) {
        // Hard-cap tiers throw here when adding this person would push
        // the owner past their seat ceiling. Pro/Business pass through and
        // overage is synced after the insert.
        await assertCanAddSeat(clan.createdBy, request.profileId!);

        await db.insert(clanMembers).values({
          clanId: inv.clanId,
          userId: request.profileId!,
          role: inv.role,
          invitedBy: inv.invitedBy,
        });
      }

      await db
        .update(clanInvitations)
        .set({ acceptedAt: new Date() })
        .where(eq(clanInvitations.id, inv.id));

      // Best-effort overage sync — failures are logged but don't block accept.
      try {
        await syncSeatQuantityToStripe(clan.createdBy);
      } catch (err) {
        request.log.error({ err, ownerId: clan.createdBy }, 'syncSeatQuantityToStripe failed');
      }

      return { data: { clanId: inv.clanId } };
    },
  );
}

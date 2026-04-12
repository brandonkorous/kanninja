import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireClanRole } from '../../middleware/require-clan-role.js';
import { db } from '../../db/index.js';
import { clans, clanMembers, clanSettings } from '../../db/schema/clans.js';
import { boards } from '../../db/schema/boards.js';
import { boardClans } from '../../db/schema/board-clans.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { createClanSchema, updateClanSchema } from '@kanninja/shared';

export async function clanRoutes(fastify: FastifyInstance) {
  // List clans the user is a member of
  fastify.get('/api/v1/clans', { preHandler: [requireAuth] }, async (request) => {
    const data = await db
      .select({
        id: clans.id,
        name: clans.name,
        description: clans.description,
        createdBy: clans.createdBy,
        isPersonal: clans.isPersonal,
        createdAt: clans.createdAt,
        updatedAt: clans.updatedAt,
        role: clanMembers.role,
      })
      .from(clans)
      .innerJoin(clanMembers, eq(clans.id, clanMembers.clanId))
      .where(eq(clanMembers.userId, request.profileId!))
      // Pin the user's personal clan to the top — it's a first-class
      // citizen and should never get pushed below by recently-active
      // shared clans. Within each group, fall back to recency.
      .orderBy(desc(clans.isPersonal), desc(clans.updatedAt));

    return { data };
  });

  // Get a single clan, including the caller's role on it. The role is
  // needed by the UI to gate admin-only controls (Invite button, member
  // role selects, remove buttons) — the backend still enforces the
  // permissions in middleware, but hiding disabled controls upfront is
  // cleaner than letting users click them and hit a 403.
  fastify.get<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId',
    { preHandler: [requireAuth, requireClanRole('reader')] },
    async (request) => {
      const [row] = await db
        .select({
          id: clans.id,
          name: clans.name,
          description: clans.description,
          createdBy: clans.createdBy,
          isPersonal: clans.isPersonal,
          createdAt: clans.createdAt,
          updatedAt: clans.updatedAt,
          currentUserRole: clanMembers.role,
        })
        .from(clans)
        .innerJoin(
          clanMembers,
          and(
            eq(clanMembers.clanId, clans.id),
            eq(clanMembers.userId, request.profileId!),
          ),
        )
        .where(eq(clans.id, request.params.clanId))
        .limit(1);

      if (!row) throw AppError.notFound('Clan');
      return { data: row };
    },
  );

  // Create clan
  fastify.post('/api/v1/clans', { preHandler: [requireAuth] }, async (request, reply) => {
    const input = createClanSchema.parse(request.body);

    const [clan] = await db
      .insert(clans)
      .values({
        name: input.name,
        description: input.description ?? null,
        createdBy: request.profileId!,
      })
      .returning();

    // Auto-add creator as admin
    await db.insert(clanMembers).values({
      clanId: clan.id,
      userId: request.profileId!,
      role: 'admin',
    });

    // Create default settings
    await db.insert(clanSettings).values({ clanId: clan.id });

    return reply.status(201).send({ data: clan });
  });

  // Update clan
  fastify.patch<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request) => {
      const input = updateClanSchema.parse(request.body);
      const [clan] = await db
        .update(clans)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(clans.id, request.params.clanId))
        .returning();
      return { data: clan };
    },
  );

  // Delete clan — refuses to delete the user's auto-provisioned
  // personal clan. It's the anchor for personal boards and the
  // default home for new dojos; killing it would orphan the user.
  fastify.delete<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request, reply) => {
      const [target] = await db
        .select({ isPersonal: clans.isPersonal })
        .from(clans)
        .where(eq(clans.id, request.params.clanId))
        .limit(1);

      if (!target) throw AppError.notFound('Clan');
      if (target.isPersonal) {
        throw AppError.forbidden('Your personal clan cannot be deleted');
      }

      await db.delete(clans).where(eq(clans.id, request.params.clanId));
      return reply.status(204).send();
    },
  );

  // List clan members
  fastify.get<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId/members',
    { preHandler: [requireAuth, requireClanRole('reader')] },
    async (request) => {
      const data = await db
        .select({
          id: clanMembers.id,
          userId: clanMembers.userId,
          role: clanMembers.role,
          joinedAt: clanMembers.joinedAt,
          displayName: profiles.displayName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        })
        .from(clanMembers)
        .innerJoin(profiles, eq(clanMembers.userId, profiles.id))
        .where(eq(clanMembers.clanId, request.params.clanId));
      return { data };
    },
  );

  // Update member role. Mirrors the "last admin" guard from the
  // remove-member route: an admin cannot be demoted if they are the
  // only admin in the clan, otherwise the clan would be orphaned with
  // no one able to invite or manage it.
  fastify.patch<{ Params: { clanId: string; memberId: string }; Body: { role: 'admin' | 'member' | 'reader' } }>(
    '/api/v1/clans/:clanId/members/:memberId',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request) => {
      const [current] = await db
        .select()
        .from(clanMembers)
        .where(eq(clanMembers.id, request.params.memberId))
        .limit(1);

      if (!current) throw AppError.notFound('Clan member');

      // If we're demoting the target AND they're currently admin, check
      // that they aren't the last one standing.
      if (current.role === 'admin' && request.body.role !== 'admin') {
        const admins = await db
          .select()
          .from(clanMembers)
          .where(
            and(eq(clanMembers.clanId, current.clanId), eq(clanMembers.role, 'admin')),
          );
        if (admins.length === 1) {
          throw AppError.forbidden('Cannot demote the last admin');
        }
      }

      const [member] = await db
        .update(clanMembers)
        .set({ role: request.body.role, updatedAt: new Date() })
        .where(eq(clanMembers.id, request.params.memberId))
        .returning();
      return { data: member };
    },
  );

  // Remove member
  fastify.delete<{ Params: { clanId: string; memberId: string } }>(
    '/api/v1/clans/:clanId/members/:memberId',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request, reply) => {
      const [member] = await db
        .select()
        .from(clanMembers)
        .where(eq(clanMembers.id, request.params.memberId))
        .limit(1);

      if (!member) throw AppError.notFound('Clan member');

      // Prevent removing the last admin
      if (member.role === 'admin') {
        const admins = await db
          .select()
          .from(clanMembers)
          .where(and(eq(clanMembers.clanId, member.clanId), eq(clanMembers.role, 'admin')));
        if (admins.length === 1) throw AppError.forbidden('Cannot remove the last admin');
      }

      await db.delete(clanMembers).where(eq(clanMembers.id, request.params.memberId));
      return reply.status(204).send();
    },
  );

  // List boards this clan has access to — joins the `board_clans`
  // grant table instead of the old single `boards.clanId` column so
  // the same board can show up for multiple clans it's attached to.
  // The clan's role ON each board is returned alongside the board.
  fastify.get<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId/boards',
    { preHandler: [requireAuth, requireClanRole('reader')] },
    async (request) => {
      const data = await db
        .select({
          id: boards.id,
          userId: boards.userId,
          title: boards.title,
          description: boards.description,
          financialTrackingEnabled: boards.financialTrackingEnabled,
          projectBudget: boards.projectBudget,
          projectValueGoal: boards.projectValueGoal,
          currencyCode: boards.currencyCode,
          createdAt: boards.createdAt,
          updatedAt: boards.updatedAt,
          clanRole: boardClans.role,
        })
        .from(boardClans)
        .innerJoin(boards, eq(boards.id, boardClans.boardId))
        .where(eq(boardClans.clanId, request.params.clanId))
        .orderBy(desc(boards.updatedAt));
      return { data };
    },
  );

  // Get clan settings
  fastify.get<{ Params: { clanId: string } }>(
    '/api/v1/clans/:clanId/settings',
    { preHandler: [requireAuth, requireClanRole('reader')] },
    async (request) => {
      const [settings] = await db
        .select()
        .from(clanSettings)
        .where(eq(clanSettings.clanId, request.params.clanId))
        .limit(1);
      return { data: settings };
    },
  );

  // Update clan settings
  fastify.patch<{ Params: { clanId: string }; Body: Record<string, unknown> }>(
    '/api/v1/clans/:clanId/settings',
    { preHandler: [requireAuth, requireClanRole('admin')] },
    async (request) => {
      const [settings] = await db
        .update(clanSettings)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(clanSettings.clanId, request.params.clanId))
        .returning();
      return { data: settings };
    },
  );
}

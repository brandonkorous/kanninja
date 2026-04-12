import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { requireBoardCreator } from '../../middleware/require-board-creator.js';
import { db } from '../../db/index.js';
import { boardClans } from '../../db/schema/board-clans.js';
import { clans } from '../../db/schema/clans.js';
import { AppError } from '../../utils/errors.js';

const attachClanSchema = z.object({
  clanId: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']).default('editor'),
});

const updateBoardClanRoleSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
});

export async function boardClansRoutes(fastify: FastifyInstance) {
  // List clans attached to a board — any user with board access can
  // see the attachment list (it's part of the board's metadata).
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/clans',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select({
          id: boardClans.id,
          clanId: boardClans.clanId,
          role: boardClans.role,
          createdAt: boardClans.createdAt,
          clanName: clans.name,
          clanDescription: clans.description,
          isPersonal: clans.isPersonal,
        })
        .from(boardClans)
        .innerJoin(clans, eq(clans.id, boardClans.clanId))
        .where(eq(boardClans.boardId, request.params.boardId));
      return { data };
    },
  );

  // Attach a clan to a board. Creator-only: attaching clans is an
  // ownership act. Conflicts if the clan is already attached.
  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/clans',
    { preHandler: [requireAuth, requireBoardCreator] },
    async (request, reply) => {
      const input = attachClanSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(boardClans)
        .where(
          and(
            eq(boardClans.boardId, request.params.boardId),
            eq(boardClans.clanId, input.clanId),
          ),
        )
        .limit(1);

      if (existing) throw AppError.conflict('Clan is already attached to this board');

      const [row] = await db
        .insert(boardClans)
        .values({
          boardId: request.params.boardId,
          clanId: input.clanId,
          role: input.role,
        })
        .returning();

      return reply.status(201).send({ data: row });
    },
  );

  // Change a clan's role on a board. Creator-only.
  fastify.patch<{ Params: { boardId: string; clanId: string } }>(
    '/api/v1/boards/:boardId/clans/:clanId',
    { preHandler: [requireAuth, requireBoardCreator] },
    async (request) => {
      const input = updateBoardClanRoleSchema.parse(request.body);

      const [row] = await db
        .update(boardClans)
        .set({ role: input.role, updatedAt: new Date() })
        .where(
          and(
            eq(boardClans.boardId, request.params.boardId),
            eq(boardClans.clanId, request.params.clanId),
          ),
        )
        .returning();

      if (!row) throw AppError.notFound('Clan attachment');
      return { data: row };
    },
  );

  // Detach a clan from a board. Creator-only. Does NOT delete the
  // clan itself — just removes this board grant.
  fastify.delete<{ Params: { boardId: string; clanId: string } }>(
    '/api/v1/boards/:boardId/clans/:clanId',
    { preHandler: [requireAuth, requireBoardCreator] },
    async (request, reply) => {
      const deleted = await db
        .delete(boardClans)
        .where(
          and(
            eq(boardClans.boardId, request.params.boardId),
            eq(boardClans.clanId, request.params.clanId),
          ),
        )
        .returning();

      if (deleted.length === 0) throw AppError.notFound('Clan attachment');
      return reply.status(204).send();
    },
  );
}

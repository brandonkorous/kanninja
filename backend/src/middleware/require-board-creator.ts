import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { boards } from '../db/schema/boards.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

/**
 * Gate for actions that only the board's creator may perform — most
 * notably attaching, detaching, or re-roling clans on the board.
 *
 * Rationale: attaching a clan to a board is an ownership-level act.
 * Letting any 'owner'-via-clan do it would create chain-of-custody
 * weirdness ("Alice added the Contractors clan via her admin seat in
 * Core Team; now what if Core Team is detached?"). MVP-safe is
 * creator-only. Can be relaxed to "anyone with effective 'owner' on
 * the board" later if users ask.
 */
export async function requireBoardCreator(
  request: FastifyRequest<{ Params: { boardId: string } }>,
  _reply: FastifyReply,
) {
  const { boardId } = request.params;
  const userId = request.profileId;

  if (!userId) throw AppError.unauthorized();

  const [board] = await db
    .select({ userId: boards.userId })
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) throw AppError.notFound('Board');
  if (board.userId !== userId) {
    throw AppError.forbidden('Only the board creator can manage clan access');
  }
}

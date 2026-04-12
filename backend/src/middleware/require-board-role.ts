import { FastifyRequest, FastifyReply } from 'fastify';
import { resolveBoardRole } from '../repositories/board.repo.js';
import { BOARD_ROLE_RANK } from '../utils/board-roles.js';
import { AppError } from '../utils/errors.js';
import type { BoardRole } from '@kanninja/shared';

/**
 * Middleware factory — requires the user to have at least `minRole`
 * on the board in the request params.
 *
 * Access resolution lives in `resolveBoardRole` (board.repo.ts) as
 * the single source of truth. The 26 routes that call this keep
 * their signatures unchanged; only the implementation moved from
 * "query board_members" to "creator short-circuit + board_clans join
 * clan_members, max role wins".
 */
export function requireBoardRole(minRole: BoardRole) {
  return async function (
    request: FastifyRequest<{ Params: { boardId: string } }>,
    _reply: FastifyReply,
  ) {
    const { boardId } = request.params;
    const userId = request.profileId;

    if (!userId) throw AppError.unauthorized();

    const effective = await resolveBoardRole(boardId, userId);

    if (!effective) {
      throw AppError.forbidden('You do not have access to this board');
    }

    if (BOARD_ROLE_RANK[effective] < BOARD_ROLE_RANK[minRole]) {
      throw AppError.forbidden(`This action requires ${minRole} access or higher`);
    }
  };
}

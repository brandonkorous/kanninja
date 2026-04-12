import { boardRepo } from '../repositories/board.repo.js';
import { AppError } from '../utils/errors.js';
import type { CreateBoardInput, UpdateBoardInput } from '@kanninja/shared';

export const boardService = {
  async listBoards(userId: string) {
    return boardRepo.findAllForUser(userId);
  },

  async getBoard(boardId: string, userId: string) {
    const role = await boardRepo.getMemberRole(boardId, userId);
    if (!role) throw AppError.forbidden('You do not have access to this board');

    const board = await boardRepo.findByIdWithChildren(boardId);
    if (!board) throw AppError.notFound('Board');

    // Distinguish creator from "owner via attached clan" — both
    // resolve to role='owner' but only the creator can manage clan
    // attachments. The frontend gates the BoardClanPanel controls
    // on this flag.
    return {
      ...board,
      currentUserRole: role,
      isCreator: board.userId === userId,
    };
  },

  async createBoard(input: CreateBoardInput, userId: string) {
    return boardRepo.create({
      title: input.title,
      description: input.description,
      userId,
      clanId: input.clanId,
    });
  },

  async updateBoard(boardId: string, input: UpdateBoardInput) {
    const board = await boardRepo.findById(boardId);
    if (!board) throw AppError.notFound('Board');

    return boardRepo.update(boardId, {
      title: input.title,
      description: input.description,
      financialTrackingEnabled: input.financialTrackingEnabled,
      projectBudget: input.projectBudget?.toString() ?? undefined,
      projectValueGoal: input.projectValueGoal?.toString() ?? undefined,
      currencyCode: input.currencyCode,
    });
  },

  async deleteBoard(boardId: string) {
    const board = await boardRepo.findById(boardId);
    if (!board) throw AppError.notFound('Board');

    await boardRepo.delete(boardId);
  },
};

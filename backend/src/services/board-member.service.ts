import { boardMemberRepo } from '../repositories/board-member.repo.js';

export const boardMemberService = {
  async listMembers(boardId: string) {
    return boardMemberRepo.findAllForBoard(boardId);
  },
};

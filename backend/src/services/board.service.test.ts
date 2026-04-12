import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boardService } from './board.service.js';

// Mock the board repo
vi.mock('../repositories/board.repo.js', () => ({
  boardRepo: {
    findAllForUser: vi.fn(),
    findById: vi.fn(),
    findByIdWithChildren: vi.fn(),
    getMemberRole: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { boardRepo } from '../repositories/board.repo.js';

const mockRepo = vi.mocked(boardRepo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('boardService', () => {
  const userId = 'user-1';
  const boardId = 'board-1';

  describe('listBoards', () => {
    it('delegates to repo.findAllForUser', async () => {
      const boards = [{ id: boardId, title: 'Test' }];
      mockRepo.findAllForUser.mockResolvedValue(boards as any);

      const result = await boardService.listBoards(userId);

      expect(mockRepo.findAllForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(boards);
    });
  });

  describe('getBoard', () => {
    it('returns board with currentUserRole and isCreator flag', async () => {
      mockRepo.getMemberRole.mockResolvedValue('owner');
      mockRepo.findByIdWithChildren.mockResolvedValue({
        id: boardId,
        title: 'My Board',
        userId,
        lists: [],
      } as any);

      const result = await boardService.getBoard(boardId, userId);

      expect(result.currentUserRole).toBe('owner');
      expect(result.isCreator).toBe(true);
    });

    it('sets isCreator=false when user is not the creator', async () => {
      mockRepo.getMemberRole.mockResolvedValue('editor');
      mockRepo.findByIdWithChildren.mockResolvedValue({
        id: boardId,
        title: 'Their Board',
        userId: 'other-user',
        lists: [],
      } as any);

      const result = await boardService.getBoard(boardId, userId);

      expect(result.currentUserRole).toBe('editor');
      expect(result.isCreator).toBe(false);
    });

    it('throws forbidden when user has no role', async () => {
      mockRepo.getMemberRole.mockResolvedValue(null);

      await expect(boardService.getBoard(boardId, userId)).rejects.toThrow(
        'You do not have access to this board',
      );
    });

    it('throws not found when board does not exist', async () => {
      mockRepo.getMemberRole.mockResolvedValue('owner');
      mockRepo.findByIdWithChildren.mockResolvedValue(null);

      await expect(boardService.getBoard(boardId, userId)).rejects.toThrow('not found');
    });
  });

  describe('createBoard', () => {
    it('passes title, description, and userId to repo', async () => {
      const input = { title: 'New Board', description: 'Desc' };
      mockRepo.create.mockResolvedValue({ id: boardId, ...input } as any);

      await boardService.createBoard(input, userId);

      expect(mockRepo.create).toHaveBeenCalledWith({
        title: 'New Board',
        description: 'Desc',
        userId,
        clanId: undefined,
      });
    });

    it('forwards clanId when provided', async () => {
      const input = { title: 'Clan Board', clanId: 'clan-1' };
      mockRepo.create.mockResolvedValue({ id: boardId } as any);

      await boardService.createBoard(input, userId);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ clanId: 'clan-1' }),
      );
    });
  });

  describe('updateBoard', () => {
    it('throws not found when board does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        boardService.updateBoard(boardId, { title: 'Updated' }),
      ).rejects.toThrow('not found');
    });

    it('converts numeric fields to strings', async () => {
      mockRepo.findById.mockResolvedValue({ id: boardId } as any);
      mockRepo.update.mockResolvedValue({ id: boardId } as any);

      await boardService.updateBoard(boardId, {
        projectBudget: 5000,
        projectValueGoal: 10000,
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        boardId,
        expect.objectContaining({
          projectBudget: '5000',
          projectValueGoal: '10000',
        }),
      );
    });
  });

  describe('deleteBoard', () => {
    it('throws not found when board does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(boardService.deleteBoard(boardId)).rejects.toThrow('not found');
    });

    it('deletes existing board', async () => {
      mockRepo.findById.mockResolvedValue({ id: boardId } as any);
      mockRepo.delete.mockResolvedValue(undefined);

      await boardService.deleteBoard(boardId);

      expect(mockRepo.delete).toHaveBeenCalledWith(boardId);
    });
  });
});

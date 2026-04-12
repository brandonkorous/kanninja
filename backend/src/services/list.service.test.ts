import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listService } from './list.service.js';

vi.mock('../repositories/list.repo.js', () => ({
  listRepo: {
    findByBoard: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../utils/order-index.js', () => ({
  generateNIndices: vi.fn((n: number) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length: n }, (_, i) => chars[i]);
  }),
}));

import { listRepo } from '../repositories/list.repo.js';

const mockRepo = vi.mocked(listRepo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listService', () => {
  const boardId = 'board-1';
  const listId = 'list-1';

  describe('listByBoard', () => {
    it('delegates to repo', async () => {
      const lists = [{ id: listId, title: 'To Do' }];
      mockRepo.findByBoard.mockResolvedValue(lists as any);

      const result = await listService.listByBoard(boardId);
      expect(result).toEqual(lists);
    });
  });

  describe('createList', () => {
    it('passes boardId and title to repo', async () => {
      mockRepo.create.mockResolvedValue({ id: listId } as any);

      await listService.createList(boardId, { title: 'In Progress' });

      expect(mockRepo.create).toHaveBeenCalledWith({
        boardId,
        title: 'In Progress',
      });
    });
  });

  describe('updateList', () => {
    it('throws not found for missing list', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        listService.updateList(listId, { title: 'Updated' }),
      ).rejects.toThrow('not found');
    });

    it('updates existing list title', async () => {
      mockRepo.findById.mockResolvedValue({ id: listId } as any);
      mockRepo.update.mockResolvedValue({ id: listId } as any);

      await listService.updateList(listId, { title: 'Done' });

      expect(mockRepo.update).toHaveBeenCalledWith(listId, { title: 'Done' });
    });
  });

  describe('deleteList', () => {
    it('throws not found for missing list', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(listService.deleteList(listId)).rejects.toThrow('not found');
    });

    it('deletes existing list', async () => {
      mockRepo.findById.mockResolvedValue({ id: listId } as any);
      mockRepo.delete.mockResolvedValue(undefined);

      await listService.deleteList(listId);

      expect(mockRepo.delete).toHaveBeenCalledWith(listId);
    });
  });

  describe('reorderLists', () => {
    it('updates each list with a new order index and returns refreshed list', async () => {
      const orderedIds = ['list-3', 'list-1', 'list-2'];
      const refreshed = orderedIds.map((id) => ({ id }));
      mockRepo.update.mockResolvedValue({} as any);
      mockRepo.findByBoard.mockResolvedValue(refreshed as any);

      const result = await listService.reorderLists(boardId, { orderedIds });

      expect(mockRepo.update).toHaveBeenCalledTimes(3);
      expect(result).toEqual(refreshed);
    });
  });
});

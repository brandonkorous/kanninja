import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cardService } from './card.service.js';

vi.mock('../repositories/card.repo.js', () => ({
  cardRepo: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    headIndexFor: vi.fn(),
    tailIndexFor: vi.fn(),
  },
}));

import { cardRepo } from '../repositories/card.repo.js';

const mockRepo = vi.mocked(cardRepo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cardService', () => {
  const cardId = 'card-1';

  describe('getCard', () => {
    it('returns existing card', async () => {
      const card = { id: cardId, title: 'Task' };
      mockRepo.findById.mockResolvedValue(card as any);

      const result = await cardService.getCard(cardId);
      expect(result).toEqual(card);
    });

    it('throws not found for missing card', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(cardService.getCard(cardId)).rejects.toThrow('not found');
    });
  });

  describe('createCard', () => {
    it('passes all fields to repo', async () => {
      const input = {
        listId: 'list-1',
        title: 'New Card',
        description: 'Details',
        priority: 'high' as const,
        assigneeId: 'user-1',
        dueDate: '2026-12-31',
        estimatedHours: 4,
      };
      mockRepo.create.mockResolvedValue({ id: cardId, ...input } as any);

      await cardService.createCard(input);

      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateCard', () => {
    it('throws not found for missing card', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        cardService.updateCard(cardId, { title: 'Updated' }),
      ).rejects.toThrow('not found');
    });

    it('only includes provided fields in update', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.updateCard(cardId, { title: 'Updated' });

      expect(mockRepo.update).toHaveBeenCalledWith(cardId, { title: 'Updated' });
    });

    it('handles isCompleted=true by setting completedAt', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.updateCard(cardId, { isCompleted: true });

      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.isCompleted).toBe(true);
      expect(updateArg.completedAt).toBeInstanceOf(Date);
    });

    it('handles isCompleted=false by clearing completedAt', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.updateCard(cardId, { isCompleted: false });

      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.isCompleted).toBe(false);
      expect(updateArg.completedAt).toBeNull();
    });

    it('converts dueDate string to Date object', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.updateCard(cardId, { dueDate: '2026-06-15' });

      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.dueDate).toBeInstanceOf(Date);
    });

    it('converts estimatedHours to string', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.updateCard(cardId, { estimatedHours: 8 });

      const updateArg = mockRepo.update.mock.calls[0][1];
      expect(updateArg.estimatedHours).toBe('8');
    });
  });

  describe('moveCard', () => {
    it('throws not found for missing card', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        cardService.moveCard(cardId, { listId: 'list-2', orderIndex: 'n' }),
      ).rejects.toThrow('not found');
    });

    it('updates listId and orderIndex', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);

      await cardService.moveCard(cardId, { listId: 'list-2', orderIndex: 'n' });

      expect(mockRepo.update).toHaveBeenCalledWith(cardId, {
        listId: 'list-2',
        orderIndex: 'n',
      });
    });

    it('resolves a symbolic top position against the target list', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);
      mockRepo.headIndexFor.mockResolvedValue('g');

      await cardService.moveCard(cardId, { listId: 'list-2', position: 'top' });

      expect(mockRepo.headIndexFor).toHaveBeenCalledWith('list-2');
      expect(mockRepo.update).toHaveBeenCalledWith(cardId, {
        listId: 'list-2',
        orderIndex: 'g',
      });
    });

    it('resolves a symbolic bottom position against the target list', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);
      mockRepo.tailIndexFor.mockResolvedValue('nn');

      await cardService.moveCard(cardId, { listId: 'list-2', position: 'bottom' });

      expect(mockRepo.tailIndexFor).toHaveBeenCalledWith('list-2');
      expect(mockRepo.update).toHaveBeenCalledWith(cardId, {
        listId: 'list-2',
        orderIndex: 'nn',
      });
    });

    it('prefers the resolved position over a client-supplied index', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.update.mockResolvedValue({ id: cardId } as any);
      mockRepo.headIndexFor.mockResolvedValue('b');

      await cardService.moveCard(cardId, {
        listId: 'list-2',
        orderIndex: 'stale',
        position: 'top',
      });

      expect(mockRepo.update).toHaveBeenCalledWith(cardId, {
        listId: 'list-2',
        orderIndex: 'b',
      });
    });
  });

  describe('deleteCard', () => {
    it('throws not found for missing card', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(cardService.deleteCard(cardId)).rejects.toThrow('not found');
    });

    it('deletes existing card', async () => {
      mockRepo.findById.mockResolvedValue({ id: cardId } as any);
      mockRepo.delete.mockResolvedValue(undefined);

      await cardService.deleteCard(cardId);

      expect(mockRepo.delete).toHaveBeenCalledWith(cardId);
    });
  });
});

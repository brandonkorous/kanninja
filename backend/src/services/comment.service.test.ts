import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commentService } from './comment.service.js';

vi.mock('../repositories/comment.repo.js', () => ({
  commentRepo: {
    findByCard: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { commentRepo } from '../repositories/comment.repo.js';

const mockRepo = vi.mocked(commentRepo);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('commentService', () => {
  const cardId = 'card-1';
  const userId = 'user-1';
  const otherUserId = 'user-2';
  const commentId = 'comment-1';

  describe('listByCard', () => {
    it('delegates to repo', async () => {
      const comments = [{ id: commentId, content: 'Hello' }];
      mockRepo.findByCard.mockResolvedValue(comments as any);

      const result = await commentService.listByCard(cardId);
      expect(result).toEqual(comments);
      expect(mockRepo.findByCard).toHaveBeenCalledWith(cardId);
    });
  });

  describe('create', () => {
    it('passes cardId, userId, and input to repo', async () => {
      const input = { content: 'Great work!', mentions: ['user-2'], replyTo: undefined };
      mockRepo.create.mockResolvedValue({ id: commentId } as any);

      await commentService.create(cardId, userId, input);

      expect(mockRepo.create).toHaveBeenCalledWith({
        cardId,
        userId,
        content: 'Great work!',
        mentions: ['user-2'],
        replyTo: undefined,
      });
    });
  });

  describe('update', () => {
    it('throws not found for missing comment', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.update(commentId, userId, { content: 'Edited' }),
      ).rejects.toThrow('not found');
    });

    it('throws forbidden when editing another user\'s comment', async () => {
      mockRepo.findById.mockResolvedValue({
        id: commentId,
        userId: otherUserId,
      } as any);

      await expect(
        commentService.update(commentId, userId, { content: 'Edited' }),
      ).rejects.toThrow("Cannot edit another user's comment");
    });

    it('allows editing own comment', async () => {
      mockRepo.findById.mockResolvedValue({
        id: commentId,
        userId,
      } as any);
      mockRepo.update.mockResolvedValue({ id: commentId } as any);

      await commentService.update(commentId, userId, { content: 'Edited' });

      expect(mockRepo.update).toHaveBeenCalledWith(commentId, 'Edited');
    });
  });

  describe('delete', () => {
    it('throws not found for missing comment', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(commentService.delete(commentId, userId)).rejects.toThrow('not found');
    });

    it('throws forbidden when deleting another user\'s comment', async () => {
      mockRepo.findById.mockResolvedValue({
        id: commentId,
        userId: otherUserId,
      } as any);

      await expect(commentService.delete(commentId, userId)).rejects.toThrow(
        "Cannot delete another user's comment",
      );
    });

    it('allows deleting own comment', async () => {
      mockRepo.findById.mockResolvedValue({
        id: commentId,
        userId,
      } as any);
      mockRepo.delete.mockResolvedValue(undefined);

      await commentService.delete(commentId, userId);

      expect(mockRepo.delete).toHaveBeenCalledWith(commentId);
    });
  });
});

import { commentRepo } from '../repositories/comment.repo.js';
import { cardRepo } from '../repositories/card.repo.js';
import { boardRepo } from '../repositories/board.repo.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/errors.js';
import type { CreateCommentInput, UpdateCommentInput } from '@kanninja/shared';

export const commentService = {
  async listByCard(cardId: string) {
    return commentRepo.findByCard(cardId);
  },

  async create(
    cardId: string,
    userId: string,
    input: CreateCommentInput,
    context: { boardId: string },
  ) {
    const comment = await commentRepo.create({
      cardId,
      userId,
      content: input.content,
      mentions: input.mentions,
      replyTo: input.replyTo,
    });

    // Fire comment notifications (non-blocking)
    this.fireCommentNotifications(cardId, userId, input, context).catch(() => {});

    return comment;
  },

  async fireCommentNotifications(
    cardId: string,
    authorId: string,
    input: CreateCommentInput,
    context: { boardId: string },
  ) {
    const card = await cardRepo.findById(cardId);
    if (!card) return;

    const board = await boardRepo.findById(context.boardId);
    if (!board) return;

    await notificationService.onCommentCreated({
      cardId,
      cardTitle: card.title,
      boardId: context.boardId,
      boardTitle: board.title,
      authorId,
      assigneeId: card.assigneeId,
      mentionedUserIds: input.mentions ?? [],
    });
  },

  async update(commentId: string, userId: string, input: UpdateCommentInput) {
    const c = await commentRepo.findById(commentId);
    if (!c) throw AppError.notFound('Comment');
    if (c.userId !== userId) throw AppError.forbidden('Cannot edit another user\'s comment');
    return commentRepo.update(commentId, input.content);
  },

  async delete(commentId: string, userId: string) {
    const c = await commentRepo.findById(commentId);
    if (!c) throw AppError.notFound('Comment');
    if (c.userId !== userId) throw AppError.forbidden('Cannot delete another user\'s comment');
    await commentRepo.delete(commentId);
  },
};

import { cardRepo } from '../repositories/card.repo.js';
import { boardRepo } from '../repositories/board.repo.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/errors.js';
import type { CreateCardInput, UpdateCardInput, MoveCardInput } from '@kanninja/shared';

interface UpdateContext {
  boardId: string;
  actorId: string;
}

export const cardService = {
  async getCard(cardId: string) {
    const card = await cardRepo.findById(cardId);
    if (!card) throw AppError.notFound('Card');
    return card;
  },

  async createCard(input: CreateCardInput, userId: string) {
    return cardRepo.create({
      listId: input.listId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      createdBy: userId,
    });
  },

  async updateCard(cardId: string, input: UpdateCardInput, context: UpdateContext) {
    const card = await cardRepo.findById(cardId);
    if (!card) throw AppError.notFound('Card');

    const updateData: Parameters<typeof cardRepo.update>[1] = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priority !== undefined)
      updateData.priority = input.priority as 'none' | 'low' | 'medium' | 'high' | 'urgent';
    if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
    if (input.dueDate !== undefined)
      updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.estimatedHours !== undefined)
      updateData.estimatedHours = input.estimatedHours?.toString() ?? null;
    if (input.progress !== undefined) updateData.progress = input.progress;

    if (input.isCompleted !== undefined) {
      updateData.isCompleted = input.isCompleted;
      updateData.completedAt = input.isCompleted ? new Date() : null;
    }

    const updated = await cardRepo.update(cardId, updateData);

    // Fire notifications (non-blocking — don't let notification
    // failures break the card update).
    this.fireNotifications(cardId, card, input, context).catch(() => {});

    return updated;
  },

  /** Check for notification-worthy changes and fire them. */
  async fireNotifications(
    cardId: string,
    oldCard: { assigneeId: string | null; title: string; isCompleted: boolean },
    input: UpdateCardInput,
    context: UpdateContext,
  ) {
    const board = await boardRepo.findById(context.boardId);
    if (!board) return;

    // Assignment changed to a new user
    if (
      input.assigneeId !== undefined &&
      input.assigneeId !== null &&
      input.assigneeId !== oldCard.assigneeId
    ) {
      await notificationService.onCardAssigned({
        cardId,
        cardTitle: input.title ?? oldCard.title,
        boardId: context.boardId,
        boardTitle: board.title,
        assigneeId: input.assigneeId,
        actorId: context.actorId,
      });
    }

    // Card just sealed
    if (input.isCompleted === true && !oldCard.isCompleted) {
      await notificationService.onCardCompleted({
        cardId,
        cardTitle: input.title ?? oldCard.title,
        boardId: context.boardId,
        boardTitle: board.title,
        boardOwnerId: board.userId,
        actorId: context.actorId,
      });
    }
  },

  async moveCard(cardId: string, input: MoveCardInput) {
    const card = await cardRepo.findById(cardId);
    if (!card) throw AppError.notFound('Card');

    return cardRepo.update(cardId, {
      listId: input.listId,
      orderIndex: input.orderIndex,
    });
  },

  async deleteCard(cardId: string) {
    const card = await cardRepo.findById(cardId);
    if (!card) throw AppError.notFound('Card');

    await cardRepo.delete(cardId);
  },
};

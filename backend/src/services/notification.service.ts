import { notificationRepo } from '../repositories/notification.repo.js';

export const notificationService = {
  /** Low-level: insert one notification. */
  async notify(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    return notificationRepo.create(params);
  },

  /** Card was assigned to a user. Notify the new assignee (skips self). */
  async onCardAssigned(params: {
    cardId: string;
    cardTitle: string;
    boardId: string;
    boardTitle: string;
    assigneeId: string;
    actorId: string;
  }) {
    if (params.assigneeId === params.actorId) return;
    await this.notify({
      userId: params.assigneeId,
      type: 'card.assigned',
      title: `Assigned to "${params.cardTitle}"`,
      message: `You were assigned to a kata in ${params.boardTitle}.`,
      data: { cardId: params.cardId, boardId: params.boardId },
    });
  },

  /** Comment created. Notify card assignee + mentioned users, excluding author. */
  async onCommentCreated(params: {
    cardId: string;
    cardTitle: string;
    boardId: string;
    boardTitle: string;
    authorId: string;
    assigneeId: string | null;
    mentionedUserIds: string[];
  }) {
    const recipients = new Set<string>();
    if (params.assigneeId) recipients.add(params.assigneeId);
    for (const uid of params.mentionedUserIds) recipients.add(uid);
    recipients.delete(params.authorId);

    if (recipients.size === 0) return;

    const rows = Array.from(recipients).map((userId) => ({
      userId,
      type: 'comment.created',
      title: `New comment on "${params.cardTitle}"`,
      message: `A comment was added to a kata in ${params.boardTitle}.`,
      data: { cardId: params.cardId, boardId: params.boardId },
    }));
    await notificationRepo.createMany(rows);
  },

  /** Card was sealed (completed). Notify the board owner (skips self). */
  async onCardCompleted(params: {
    cardId: string;
    cardTitle: string;
    boardId: string;
    boardTitle: string;
    boardOwnerId: string;
    actorId: string;
  }) {
    if (params.boardOwnerId === params.actorId) return;
    await this.notify({
      userId: params.boardOwnerId,
      type: 'card.completed',
      title: `"${params.cardTitle}" sealed`,
      message: `A kata was completed in ${params.boardTitle}.`,
      data: { cardId: params.cardId, boardId: params.boardId },
    });
  },
};

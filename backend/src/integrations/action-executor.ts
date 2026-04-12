import { cardService } from '../services/card.service.js';
import { commentService } from '../services/comment.service.js';
import type { IntegrationAction } from './types.js';

/**
 * Execute an inbound integration action against kanNINJA core services.
 * Each action type maps to a specific service method.
 */
export async function executeAction(
  action: IntegrationAction,
  connectionOwnerId: string,
): Promise<void> {
  switch (action.type) {
    case 'create_card': {
      const { listId, title, description, dueDate, priority } = action.data as {
        listId: string;
        title: string;
        description?: string;
        dueDate?: string;
        priority?: string;
      };
      if (!listId || !title) {
        throw new Error('create_card requires listId and title');
      }
      await cardService.createCard(
        { listId, title, description, dueDate, priority },
        connectionOwnerId,
      );
      break;
    }

    case 'update_card': {
      if (!action.cardId) throw new Error('update_card requires cardId');
      const boardId = action.boardId ?? (action.data.boardId as string);
      if (!boardId) throw new Error('update_card requires boardId');
      await cardService.updateCard(action.cardId, action.data, {
        boardId,
        actorId: connectionOwnerId,
      });
      break;
    }

    case 'move_card': {
      if (!action.cardId) throw new Error('move_card requires cardId');
      const { listId, orderIndex } = action.data as {
        listId: string;
        orderIndex?: string;
      };
      if (!listId) throw new Error('move_card requires listId');
      await cardService.moveCard(action.cardId, {
        listId,
        orderIndex: orderIndex ?? 'a0',
      });
      break;
    }

    case 'add_comment': {
      if (!action.cardId) throw new Error('add_comment requires cardId');
      const boardId = action.boardId ?? (action.data.boardId as string);
      if (!boardId) throw new Error('add_comment requires boardId');
      const content = action.data.content as string;
      if (!content) throw new Error('add_comment requires content');
      await commentService.create(
        action.cardId,
        connectionOwnerId,
        { content },
        { boardId },
      );
      break;
    }

    default:
      throw new Error(`Unknown integration action: ${action.type}`);
  }
}

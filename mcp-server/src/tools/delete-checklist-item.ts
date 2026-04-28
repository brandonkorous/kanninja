import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteChecklistItemTool = defineTool({
  name: 'delete_checklist_item',
  title: 'Delete Checklist Item',
  description: 'Delete a checklist item from a task.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    itemId: z.string().uuid().describe('The checklist item ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/checklist/${args.itemId}`,
    );
    return { success: true };
  },
});

import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteTaskTool = defineTool({
  name: 'delete_task',
  description: 'Delete a task (card) from a board.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}`,
    );
    return { success: true };
  },
});

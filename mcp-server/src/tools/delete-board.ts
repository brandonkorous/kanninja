import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteBoardTool = defineTool({
  name: 'delete_board',
  title: 'Delete Dojo',
  description: 'Delete a dojo (board) and all of its lists, cards, and history. Owner-only.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(`/api/v1/boards/${args.boardId}`);
    return { success: true };
  },
});

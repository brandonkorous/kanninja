import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteListTool = defineTool({
  name: 'delete_list',
  description: 'Delete a list (column) from a board. All cards in the list are also removed.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    listId: z.string().uuid().describe('The list/column ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(
      `/api/v1/boards/${args.boardId}/lists/${args.listId}`,
    );
    return { success: true };
  },
});

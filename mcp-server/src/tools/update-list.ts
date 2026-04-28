import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateListTool = defineTool({
  name: 'update_list',
  description: 'Rename a list (column) on a board.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    listId: z.string().uuid().describe('The list/column ID'),
    title: z.string().min(1).max(200).describe('New list title'),
  }),
  async handler(args, ctx) {
    const { boardId, listId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${boardId}/lists/${listId}`,
      body,
    );
    return res.data;
  },
});

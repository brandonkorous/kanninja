import { z } from 'zod';
import { defineTool } from '../registry.js';

export const createListTool = defineTool({
  name: 'create_list',
  title: 'Add Column',
  description: 'Create a new list (column) on a board.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    title: z.string().min(1).max(200).describe('List title'),
  }),
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/lists`,
      body,
    );
    return res.data;
  },
});

import { z } from 'zod';
import { defineTool } from '../registry.js';

export const reorderListsTool = defineTool({
  name: 'reorder_lists',
  title: 'Reorder Columns',
  description: 'Reorder the lists (columns) on a board. Pass the list IDs in the desired order.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    orderedIds: z
      .array(z.string().uuid())
      .min(1)
      .describe('List IDs in the new left-to-right order'),
  }),
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/lists/reorder`,
      body,
    );
    return res.data;
  },
});

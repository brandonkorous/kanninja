import { z } from 'zod';
import { defineTool } from '../registry.js';

export const listLabelsTool = defineTool({
  name: 'list_labels',
  description:
    'List labels available on a board. Includes the user\'s global labels plus any board-scoped ones.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/labels`,
    );
    return res.data;
  },
});

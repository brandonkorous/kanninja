import { z } from 'zod';
import { defineTool } from '../registry.js';

export const getBoardTool = defineTool({
  name: 'get_board',
  readOnly: true,
  title: 'Get Dojo',
  description: 'Get a single board with its columns, cards, and members.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>(`/api/v1/boards/${args.boardId}`);
    return res.data;
  },
});

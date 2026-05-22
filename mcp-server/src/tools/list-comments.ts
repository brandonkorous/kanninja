import { z } from 'zod';
import { defineTool } from '../registry.js';

export const listCommentsTool = defineTool({
  name: 'list_comments',
  readOnly: true,
  title: 'List Comments',
  description: 'List all comments on a task, oldest first.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/comments`,
    );
    return res.data;
  },
});

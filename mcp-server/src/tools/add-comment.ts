import { z } from 'zod';
import { defineTool } from '../registry.js';

export const addCommentTool = defineTool({
  name: 'add_comment',
  description: 'Add a comment to a task. Posts as the authenticated user.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    content: z.string().min(1).max(5000).describe('Comment text'),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/comments`,
      body,
    );
    return res.data;
  },
});

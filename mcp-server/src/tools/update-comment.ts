import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateCommentTool = defineTool({
  name: 'update_comment',
  description: 'Edit the text of a comment. Only the comment author can edit.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    commentId: z.string().uuid().describe('The comment ID'),
    content: z.string().min(1).max(5000).describe('New comment text'),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, commentId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
      body,
    );
    return res.data;
  },
});

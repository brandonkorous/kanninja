import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteCommentTool = defineTool({
  name: 'delete_comment',
  title: 'Delete Comment',
  description: 'Delete a comment from a task. Only the comment author can delete.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    commentId: z.string().uuid().describe('The comment ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/comments/${args.commentId}`,
    );
    return { success: true };
  },
});

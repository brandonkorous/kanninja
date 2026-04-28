import { z } from 'zod';
import { defineTool } from '../registry.js';

export const removeLabelTool = defineTool({
  name: 'remove_label',
  title: 'Remove Label from Kata',
  description: 'Remove a label from a task.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    labelId: z.string().uuid().describe('The label ID to remove'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.delete<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/labels/${args.labelId}`,
    );
    return res.data;
  },
});

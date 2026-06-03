import { z } from 'zod';
import { defineTool } from '../registry.js';

export const setDueDateTool = defineTool({
  name: 'set_due_date',
  title: 'Set Due Date',
  description: 'Set or clear the due date on a task.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    dueDate: z.string().datetime().nullable().describe('Due date in ISO format, or null to clear'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}`,
      { dueDate: args.dueDate },
    );
    return res.data;
  },
});

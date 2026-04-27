import { z } from 'zod';
import { defineTool } from '../registry.js';

export const createTaskTool = defineTool({
  name: 'create_task',
  description: 'Create a new task (card) on a board. Requires the listId of the column to place it in.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    listId: z.string().uuid().describe('The column/list ID to place the card in'),
    title: z.string().min(1).max(500).describe('Task title'),
    description: z.string().max(10000).optional().describe('Task description'),
    priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
    assigneeId: z.string().uuid().optional().describe('User ID to assign the task to'),
    dueDate: z.string().datetime().optional().describe('Due date in ISO format'),
    estimatedHours: z.number().nonnegative().optional(),
  }),
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards`,
      body,
    );
    return res.data;
  },
});

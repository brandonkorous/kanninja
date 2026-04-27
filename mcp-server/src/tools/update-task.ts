import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateTaskTool = defineTool({
  name: 'update_task',
  description: 'Update a task — title, description, priority, due date, progress, or completion status.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(10000).nullable().optional(),
    priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    isCompleted: z.boolean().optional(),
    estimatedHours: z.number().nonnegative().nullable().optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}`,
      body,
    );
    return res.data;
  },
});

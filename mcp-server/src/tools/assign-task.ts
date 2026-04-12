import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const assignTaskTool = defineTool({
  name: 'assign_task',
  description: 'Assign a task to a user, or unassign by passing null.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    assigneeId: z.string().uuid().nullable().describe('User ID to assign, or null to unassign'),
  }),
  async handler(args) {
    const res = await callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}`,
      { assigneeId: args.assigneeId },
    );
    return res.data;
  },
});

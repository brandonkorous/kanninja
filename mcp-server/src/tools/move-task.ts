import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const moveTaskTool = defineTool({
  name: 'move_task',
  description: 'Move a task to a different column or change its order within a column.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    listId: z.string().uuid().describe('Target column/list ID'),
    orderIndex: z.string().describe('Fractional index for ordering'),
  }),
  async handler(args) {
    const { boardId, cardId, ...body } = args;
    const res = await callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/move`,
      body,
    );
    return res.data;
  },
});

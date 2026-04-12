import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const getTaskTool = defineTool({
  name: 'get_task',
  description: 'Get full detail for a single task including comments and history.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
  }),
  async handler(args) {
    const res = await callApi.get<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}`,
    );
    return res.data;
  },
});

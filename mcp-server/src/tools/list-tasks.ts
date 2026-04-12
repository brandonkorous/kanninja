import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const listTasksTool = defineTool({
  name: 'list_tasks',
  description: 'List all tasks (cards) on a board, organized by column.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
  }),
  async handler(args) {
    // get_board returns full board with lists and cards
    const res = await callApi.get<{ data: unknown }>(`/api/v1/boards/${args.boardId}`);
    return res.data;
  },
});

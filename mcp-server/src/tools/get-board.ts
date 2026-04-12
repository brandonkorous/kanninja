import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const getBoardTool = defineTool({
  name: 'get_board',
  description: 'Get a single board with its columns, cards, and members.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
  }),
  async handler(args) {
    const res = await callApi.get<{ data: unknown }>(`/api/v1/boards/${args.boardId}`);
    return res.data;
  },
});

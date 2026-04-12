import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const addLabelTool = defineTool({
  name: 'add_label',
  description: 'Add a label to a task.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    labelId: z.string().uuid().describe('The label ID to add'),
  }),
  async handler(args) {
    const res = await callApi.post<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/labels`,
      { labelId: args.labelId },
    );
    return res.data;
  },
});

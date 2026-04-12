import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const removeLabelTool = defineTool({
  name: 'remove_label',
  description: 'Remove a label from a task.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    labelId: z.string().uuid().describe('The label ID to remove'),
  }),
  async handler(args) {
    const res = await callApi.delete<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/labels/${args.labelId}`,
    );
    return res.data;
  },
});

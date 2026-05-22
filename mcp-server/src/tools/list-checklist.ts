import { z } from 'zod';
import { defineTool } from '../registry.js';

export const listChecklistTool = defineTool({
  name: 'list_checklist',
  readOnly: true,
  title: 'List Checklist Items',
  description: 'List the checklist items on a task, in display order.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>(
      `/api/v1/boards/${args.boardId}/cards/${args.cardId}/checklist`,
    );
    return res.data;
  },
});

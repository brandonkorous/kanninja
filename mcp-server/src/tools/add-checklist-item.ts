import { z } from 'zod';
import { defineTool } from '../registry.js';

export const addChecklistItemTool = defineTool({
  name: 'add_checklist_item',
  title: 'Add Checklist Item',
  description: 'Add a new checklist item to a task. Appended to the end of the list.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    title: z.string().min(1).max(500).describe('Checklist item text'),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/checklist`,
      body,
    );
    return res.data;
  },
});

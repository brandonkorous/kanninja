import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateChecklistItemTool = defineTool({
  name: 'update_checklist_item',
  title: 'Update Checklist Item',
  description: 'Update a checklist item — rename it, mark it complete, or both.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The card/task ID'),
    itemId: z.string().uuid().describe('The checklist item ID'),
    title: z.string().min(1).max(500).optional(),
    completed: z.boolean().optional(),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, itemId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/checklist/${itemId}`,
      body,
    );
    return res.data;
  },
});

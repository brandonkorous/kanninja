import { z } from 'zod';
import { defineTool } from '../registry.js';

export const duplicateCardTool = defineTool({
  name: 'duplicate_card',
  description:
    'Clone a task. Copies title, description, priority, dates, and (by default) checklist items + label attachments to a new card. Use targetListId to drop the clone in a different column; otherwise it lands at the bottom of the source list.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    cardId: z.string().uuid().describe('The source card ID'),
    targetListId: z
      .string()
      .uuid()
      .optional()
      .describe('Target list. Defaults to the source card\'s list.'),
    includeChecklist: z.boolean().default(true),
    includeLabels: z.boolean().default(true),
    titleOverride: z.string().min(1).max(500).optional(),
  }),
  async handler(args, ctx) {
    const { boardId, cardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/${cardId}/duplicate`,
      body,
    );
    return res.data;
  },
});

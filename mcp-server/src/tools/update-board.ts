import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateBoardTool = defineTool({
  name: 'update_board',
  description: 'Update a dojo (board) — title, description, color, or financial-tracking settings.',
  inputSchema: z.object({
    boardId: z.string().uuid().describe('The board ID'),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    color: z
      .enum(['rose', 'amber', 'emerald', 'sky', 'violet', 'pink', 'teal', 'orange'])
      .nullable()
      .optional(),
    financialTrackingEnabled: z.boolean().optional(),
    projectBudget: z.number().nonnegative().nullable().optional(),
    projectValueGoal: z.number().nonnegative().nullable().optional(),
    currencyCode: z.string().length(3).optional().describe('ISO 4217 currency code, e.g. USD'),
  }),
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/boards/${boardId}`,
      body,
    );
    return res.data;
  },
});

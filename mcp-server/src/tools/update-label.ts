import { z } from 'zod';
import { defineTool } from '../registry.js';

export const updateLabelTool = defineTool({
  name: 'update_label',
  description: 'Rename a label or change its color.',
  inputSchema: z.object({
    labelId: z.string().uuid().describe('The label ID'),
    name: z.string().min(1).max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional()
      .describe('Hex color code, e.g. #ff6b6b'),
  }),
  async handler(args, ctx) {
    const { labelId, ...body } = args;
    const res = await ctx.callApi.patch<{ data: unknown }>(
      `/api/v1/labels/${labelId}`,
      body,
    );
    return res.data;
  },
});

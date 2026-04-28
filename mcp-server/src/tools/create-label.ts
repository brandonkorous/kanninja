import { z } from 'zod';
import { defineTool } from '../registry.js';

export const createLabelTool = defineTool({
  name: 'create_label',
  description:
    'Create a new label. Omit boardId for a personal/global label that can be used across boards; pass a boardId to scope it to a single board.',
  inputSchema: z.object({
    name: z.string().min(1).max(50).describe('Label name'),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .describe('Hex color code, e.g. #ff6b6b'),
    boardId: z.string().uuid().optional().describe('Board ID to scope the label to'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.post<{ data: unknown }>('/api/v1/labels', args);
    return res.data;
  },
});

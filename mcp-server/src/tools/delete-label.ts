import { z } from 'zod';
import { defineTool } from '../registry.js';

export const deleteLabelTool = defineTool({
  name: 'delete_label',
  title: 'Delete Label',
  description:
    'Delete a label. Removes it from any cards it was attached to. Only the label\'s creator can delete.',
  inputSchema: z.object({
    labelId: z.string().uuid().describe('The label ID to delete'),
  }),
  async handler(args, ctx) {
    await ctx.callApi.delete<void>(`/api/v1/labels/${args.labelId}`);
    return { success: true };
  },
});

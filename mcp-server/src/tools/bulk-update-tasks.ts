import { z } from 'zod';
import { defineTool } from '../registry.js';
import { bulkUpdateCardsSchema } from '@kanninja/shared';

const inputSchema = bulkUpdateCardsSchema.extend({
  boardId: z.string().uuid().describe('The board ID'),
});

export const bulkUpdateTasksTool = defineTool({
  name: 'bulk_update_tasks',
  title: 'Bulk Update Kata',
  description:
    'Update up to 100 tasks at once — close a sprint, retag/reprioritize many cards, mass-complete done items. Single transaction; any update failing rolls back the whole call. Every cardId must belong to the given board.',
  inputSchema,
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/bulk-update`,
      body,
    );
    return res.data;
  },
});

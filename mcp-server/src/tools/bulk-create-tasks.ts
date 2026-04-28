import { z } from 'zod';
import { defineTool } from '../registry.js';
import { bulkCreateCardsSchema } from '@kanninja/shared';

const inputSchema = bulkCreateCardsSchema.extend({
  boardId: z.string().uuid().describe('The board ID'),
});

export const bulkCreateTasksTool = defineTool({
  name: 'bulk_create_tasks',
  title: 'Bulk Create Kata',
  description:
    'Create up to 100 tasks (cards) across one or more lists on a board in a single transactional call. Faster and cheaper than a loop of create_task calls when an LLM has parsed e.g. a meeting transcript into tasks. Every listId must belong to the given board.',
  inputSchema,
  async handler(args, ctx) {
    const { boardId, ...body } = args;
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/boards/${boardId}/cards/bulk`,
      body,
    );
    return res.data;
  },
});

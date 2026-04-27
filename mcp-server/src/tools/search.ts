import { z } from 'zod';
import { defineTool } from '../registry.js';

export const searchTool = defineTool({
  name: 'search',
  description: 'Search across tasks and comments by text query. Scoped to boards the user has access to.',
  inputSchema: z.object({
    query: z.string().min(1).max(200).describe('Search text'),
    boardId: z.string().uuid().optional().describe('Limit search to a specific board'),
  }),
  async handler(args, ctx) {
    const params = new URLSearchParams({ q: args.query as string });
    if (args.boardId) params.set('boardId', args.boardId as string);
    const res = await ctx.callApi.get<{ data: unknown }>(`/api/v1/search?${params}`);
    return res.data;
  },
});

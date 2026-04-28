import { z } from 'zod';
import { defineTool } from '../registry.js';

export const listBoardsTool = defineTool({
  name: 'list_boards',
  title: 'List Dojos',
  description: 'List all dojos (boards) visible to the authenticated user.',
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>('/api/v1/boards');
    return res.data;
  },
});

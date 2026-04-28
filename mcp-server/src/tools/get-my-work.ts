import { z } from 'zod';
import { defineTool } from '../registry.js';

export const getMyWorkTool = defineTool({
  name: 'get_my_work',
  title: 'Get My Work',
  description: 'Get all tasks assigned to the authenticated user, grouped by board.',
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>('/api/v1/cards/my-work');
    return res.data;
  },
});

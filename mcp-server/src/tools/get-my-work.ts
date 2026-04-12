import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const getMyWorkTool = defineTool({
  name: 'get_my_work',
  description: 'Get all tasks assigned to the authenticated user, grouped by board.',
  inputSchema: z.object({}),
  async handler() {
    const res = await callApi.get<{ data: unknown }>('/api/v1/cards/my-work');
    return res.data;
  },
});

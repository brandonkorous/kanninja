import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const listBoardsTool = defineTool({
  name: 'list_boards',
  description: 'List all dojos (boards) visible to the authenticated user.',
  inputSchema: z.object({}),
  async handler() {
    const res = await callApi.get<{ data: unknown }>('/api/v1/boards');
    return res.data;
  },
});

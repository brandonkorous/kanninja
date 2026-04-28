import { z } from 'zod';
import { defineTool } from '../registry.js';

export const createBoardTool = defineTool({
  name: 'create_board',
  title: 'Create Dojo',
  description: 'Create a new dojo (board). Optionally attach it to a clan.',
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe('Board title'),
    description: z.string().max(2000).optional().describe('Board description'),
    clanId: z.string().uuid().optional().describe('Clan ID to attach the board to'),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.post<{ data: unknown }>('/api/v1/boards', args);
    return res.data;
  },
});

import { z } from 'zod';
import { defineTool } from '../registry.js';

export const syncIntegrationTool = defineTool({
  name: 'sync_integration',
  title: 'Sync Integration',
  description:
    'Manually trigger a sync for a specific integration connection. Use this when integration data appears stale (e.g. calendar events missing, GitHub PRs not reflected). Returns the sync result including how many items were processed.',
  inputSchema: z.object({
    connectionId: z
      .string()
      .uuid()
      .describe(
        'The integration connection ID (from list_connected_integrations).',
      ),
  }),
  async handler(args, ctx) {
    const res = await ctx.callApi.post<{ data: unknown }>(
      `/api/v1/integrations/connections/${args.connectionId}/sync`,
    );
    return res.data;
  },
});

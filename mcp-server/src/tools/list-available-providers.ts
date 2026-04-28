import { z } from 'zod';
import { defineTool } from '../registry.js';

export const listAvailableProvidersTool = defineTool({
  name: 'list_available_providers',
  title: 'List Available Integrations',
  description:
    'List all integration providers available in kanNINJA, with their tier requirements, categories, and whether the user can access them based on their subscription. Useful for suggesting integrations the user might benefit from connecting.',
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const res = await ctx.callApi.get<{ data: unknown }>(
      '/api/v1/integrations/providers',
    );
    return res.data;
  },
});

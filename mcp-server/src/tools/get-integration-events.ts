import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const getIntegrationEventsTool = defineTool({
  name: 'get_integration_events',
  description:
    'Get recent integration activity (last 20 events across all connections): inbound webhooks received, outbound events delivered, sync results, and any errors. Use this to diagnose sync issues or understand what external activity has been flowing through the user’s integrations.',
  inputSchema: z.object({}),
  async handler() {
    const res = await callApi.get<{ data: unknown }>(
      '/api/v1/integrations/events',
    );
    return res.data;
  },
});

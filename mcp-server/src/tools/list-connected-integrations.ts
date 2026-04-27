import { z } from 'zod';
import { defineTool } from '../registry.js';
import { callApi } from '../api-client.js';

export const listConnectedIntegrationsTool = defineTool({
  name: 'list_connected_integrations',
  description:
    'List all external service integrations the user has connected (e.g. Google Calendar, Slack, GitHub). Returns connection status, last sync time, and provider config. Use this to understand what data sources are available before drafting briefings, suggesting due dates, or analyzing workload.',
  inputSchema: z.object({}),
  async handler() {
    const res = await callApi.get<{ data: unknown }>(
      '/api/v1/integrations/connections',
    );
    return res.data;
  },
});

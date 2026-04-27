import type { CallApi } from './api-client.js';

export interface McpContext {
  userId: string;
  displayName: string | null;
  email: string;
  tier: string;
  apiUrl: string;
  callApi: CallApi;
}

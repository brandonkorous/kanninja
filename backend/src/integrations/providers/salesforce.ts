import { env } from '../../config/env.js';
import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

export const salesforceProvider: IntegrationProvider = {
  id: 'salesforce',
  name: 'Salesforce',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.SALESFORCE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'api refresh_token offline_access',
      state,
    });
    return `https://login.salesforce.com/services/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.SALESFORCE_CLIENT_ID,
        client_secret: env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Salesforce token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      instance_url: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      // Salesforce tokens expire in ~2 hours
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.SALESFORCE_CLIENT_ID,
        client_secret: env.SALESFORCE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Salesforce token refresh failed');

    const data = (await res.json()) as {
      access_token: string;
      instance_url: string;
    };

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  },

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch(
      `https://login.salesforce.com/services/oauth2/revoke?token=${accessToken}`,
      { method: 'POST' },
    );
  },

  // --- Inbound ---
  verifyWebhook(_payload, headers): boolean {
    // Salesforce outbound messages use IP allowlists.
    // For Platform Events, verify via the Salesforce-provided header.
    const orgId = headers['x-sfdc-org-id'];
    return !!orgId;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      type?: string;
      sobject?: {
        Id?: string;
        Name?: string;
        StageName?: string;
        Amount?: number;
        Description?: string;
      };
    };

    if (!event.sobject) return null;

    // Opportunity created
    if (event.type === 'created' && event.sobject.Name) {
      return {
        type: 'create_card',
        data: {
          title: event.sobject.Name,
          description: event.sobject.Description,
          salesforceId: event.sobject.Id,
          salesforceAmount: event.sobject.Amount,
        },
      };
    }

    // Opportunity stage changed to Closed Won
    if (event.sobject.StageName === 'Closed Won') {
      return {
        type: 'update_card',
        data: {
          isCompleted: true,
          salesforceId: event.sobject.Id,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const instanceUrl = config.instanceUrl as string;
    const salesforceId = event.data.salesforceId as string | undefined;
    if (!instanceUrl || !salesforceId) return null;

    return {
      method: 'PATCH',
      url: `${instanceUrl}/services/data/v59.0/sobjects/Opportunity/${salesforceId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { StageName: 'Closed Won' },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Salesforce API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const instanceUrl = config.instanceUrl as string;
    if (!instanceUrl) return { processed: 0, errors: ['No instance URL configured'] };

    const soql = encodeURIComponent(
      'SELECT Id, Name, StageName, Amount, CloseDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT 50',
    );

    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/query?q=${soql}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Salesforce sync failed (${res.status})`);

    const data = (await res.json()) as { records: unknown[]; totalSize: number };

    return { processed: data.records.length, errors: [] };
  },
};

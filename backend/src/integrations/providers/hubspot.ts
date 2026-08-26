import { env } from '../../config/env.js';
import { createHmac } from 'node:crypto';
import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

const SCOPES = ['crm.objects.deals.read', 'crm.objects.deals.write', 'crm.objects.contacts.read'];

export const hubspotProvider: IntegrationProvider = {
  id: 'hubspot',
  name: 'HubSpot',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.HUBSPOT_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES.join(' '),
      state,
    });
    return `https://app.hubspot.com/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`HubSpot token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.HUBSPOT_CLIENT_ID,
        client_secret: env.HUBSPOT_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('HubSpot token refresh failed');

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    const signature = headers['x-hubspot-signature-v3'];
    if (!signature) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const timestamp = headers['x-hubspot-request-timestamp'] ?? '';
    const method = 'POST';
    const uri = headers['x-forwarded-uri'] ?? '/api/webhooks/integrations/hubspot';

    const sourceString = `${method}${uri}${body}${timestamp}`;
    const expected = createHmac('sha256', env.HUBSPOT_CLIENT_SECRET)
      .update(sourceString)
      .digest('base64');

    return signature === expected;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const events = rawEvent as Array<{
      subscriptionType?: string;
      objectId?: number;
      propertyName?: string;
      propertyValue?: string;
    }>;

    if (!Array.isArray(events) || events.length === 0) return null;

    const event = events[0];

    // Deal created → create card
    if (event.subscriptionType === 'deal.creation') {
      return {
        type: 'create_card',
        data: {
          title: `HubSpot Deal #${event.objectId}`,
          hubspotDealId: event.objectId,
        },
      };
    }

    // Deal stage changed
    if (
      event.subscriptionType === 'deal.propertyChange' &&
      event.propertyName === 'dealstage'
    ) {
      return {
        type: 'update_card',
        data: {
          hubspotDealId: event.objectId,
          hubspotStage: event.propertyValue,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated') return null;

    const dealId = event.data.hubspotDealId as number | undefined;
    if (!dealId) return null;

    const properties: Record<string, unknown> = {};

    if (event.data.isCompleted) {
      properties.dealstage = 'closedwon';
    }

    if (Object.keys(properties).length === 0) return null;

    return {
      method: 'PATCH',
      url: `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { properties },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`HubSpot API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const pipelineId = config.pipelineId as string;

    const body: Record<string, unknown> = {
      limit: 50,
      properties: ['dealname', 'dealstage', 'amount', 'closedate'],
      ...(cursor ? { after: cursor } : {}),
      ...(pipelineId
        ? {
            filterGroups: [
              {
                filters: [
                  { propertyName: 'pipeline', operator: 'EQ', value: pipelineId },
                ],
              },
            ],
          }
        : {}),
    };

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HubSpot sync failed (${res.status})`);

    const data = (await res.json()) as {
      results: unknown[];
      paging?: { next?: { after?: string } };
    };

    return {
      processed: data.results.length,
      cursor: data.paging?.next?.after,
      errors: [],
    };
  },
};

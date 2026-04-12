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

const SCOPES = [
  'read:confluence-content.all',
  'read:confluence-space.summary',
  'write:confluence-content',
  'offline_access',
];

export const confluenceProvider: IntegrationProvider = {
  id: 'confluence',
  name: 'Confluence',
  requiredTier: 'business',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.ATLASSIAN_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
      audience: 'api.atlassian.com',
      prompt: 'consent',
    });
    return `https://auth.atlassian.com/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.ATLASSIAN_CLIENT_ID,
        client_secret: env.ATLASSIAN_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Atlassian token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: env.ATLASSIAN_CLIENT_ID,
        client_secret: env.ATLASSIAN_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Atlassian token refresh failed');

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
  verifyWebhook(_payload, headers): boolean {
    const auth = headers['authorization'];
    return !!auth && auth.startsWith('JWT ');
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      event?: string;
      page?: {
        id?: string;
        title?: string;
        _links?: { webui?: string };
      };
    };

    if (!event.page) return null;

    // Page updated → add comment to linked cards
    if (event.event === 'page_updated' && event.page.title) {
      return {
        type: 'add_comment',
        data: {
          content: `Confluence page "${event.page.title}" was updated.`,
          confluencePageId: event.page.id,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.created') return null;

    const cloudId = config.cloudId as string;
    const spaceKey = config.spaceKey as string;
    if (!cloudId || !spaceKey) return null;

    const title = event.data.title as string;
    const description = event.data.description as string | undefined;

    return {
      method: 'POST',
      url: `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        spaceId: spaceKey,
        title: `[kanNINJA] ${title}`,
        body: {
          representation: 'storage',
          value: `<p>${description ?? ''}</p>`,
        },
        status: 'current',
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Confluence API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const cloudId = config.cloudId as string;
    if (!cloudId) return { processed: 0, errors: ['No cloud ID configured'] };

    const params = new URLSearchParams({ limit: '50', sort: '-modified-date' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(
      `https://api.atlassian.com/ex/confluence/${cloudId}/wiki/api/v2/pages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Confluence sync failed (${res.status})`);

    const data = (await res.json()) as {
      results: unknown[];
      _links?: { next?: string };
    };

    return {
      processed: data.results.length,
      cursor: data._links?.next ? 'next' : undefined,
      errors: [],
    };
  },
};

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

export const loomProvider: IntegrationProvider = {
  id: 'loom',
  name: 'Loom',
  requiredTier: 'pro',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.LOOM_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'content:read',
      state,
    });
    return `https://www.loom.com/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://www.loom.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.LOOM_CLIENT_ID,
        client_secret: env.LOOM_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Loom token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://www.loom.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: env.LOOM_CLIENT_ID,
        client_secret: env.LOOM_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Loom token refresh failed');

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  // --- Inbound ---
  verifyWebhook(_payload, _headers): boolean {
    // Loom doesn't have webhooks — use oEmbed for URL detection
    return false;
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    return null;
  },

  // --- Outbound ---
  mapOutbound(_event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    // Loom is inbound-only (embed recordings in cards)
    return null;
  },

  async deliver(_accessToken: string, _payload: ExternalPayload): Promise<void> {
    // No outbound delivery
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    // List recent Loom recordings for the file picker
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(
      `https://api.loom.com/v1/videos?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Loom sync failed (${res.status})`);

    const data = (await res.json()) as {
      videos: unknown[];
      next_cursor?: string;
    };

    return {
      processed: data.videos.length,
      cursor: data.next_cursor,
      errors: [],
    };
  },
};

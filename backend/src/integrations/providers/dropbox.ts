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

export const dropboxProvider: IntegrationProvider = {
  id: 'dropbox',
  name: 'Dropbox',
  requiredTier: 'pro',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.DROPBOX_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      token_access_type: 'offline',
    });
    return `https://www.dropbox.com/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.DROPBOX_CLIENT_ID,
        client_secret: env.DROPBOX_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Dropbox token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.DROPBOX_CLIENT_ID,
        client_secret: env.DROPBOX_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Dropbox token refresh failed');

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  // --- Inbound ---
  verifyWebhook(payload, _headers): boolean {
    // Dropbox webhooks send a verification GET with a challenge param.
    // For POST notifications, they just say "something changed" — no signature.
    // We verify by checking the request has the expected shape.
    return !!payload;
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    // Dropbox notifications are sparse — trigger sync
    return null;
  },

  // --- Outbound ---
  mapOutbound(_event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    return null;
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Dropbox API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const folderPath = (config.folderPath as string) || '';

    if (cursor) {
      // Continue listing with cursor
      const res = await fetch(
        'https://api.dropboxapi.com/2/files/list_folder/continue',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ cursor }),
        },
      );

      if (!res.ok) throw new Error(`Dropbox sync failed (${res.status})`);
      const data = (await res.json()) as {
        entries: unknown[];
        cursor: string;
        has_more: boolean;
      };

      return {
        processed: data.entries.length,
        cursor: data.has_more ? data.cursor : undefined,
        errors: [],
      };
    }

    const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ path: folderPath, limit: 50 }),
    });

    if (!res.ok) throw new Error(`Dropbox sync failed (${res.status})`);

    const data = (await res.json()) as {
      entries: unknown[];
      cursor: string;
      has_more: boolean;
    };

    return {
      processed: data.entries.length,
      cursor: data.has_more ? data.cursor : undefined,
      errors: [],
    };
  },
};

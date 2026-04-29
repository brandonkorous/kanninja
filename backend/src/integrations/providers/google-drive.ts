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

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export const googleDriveProvider: IntegrationProvider = {
  id: 'google_drive',
  name: 'Google Drive',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Google token refresh failed');

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
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    });
  },

  // --- Inbound ---
  verifyWebhook(_payload, headers): boolean {
    const channelToken = headers['x-goog-channel-token'];
    return !!channelToken && channelToken.startsWith('kanninja_');
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    // Drive change notifications are sparse — trigger sync
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.created') return null;

    const folderId = config.folderId as string;
    const title = event.data.title as string;
    const description = event.data.description as string | undefined;

    return {
      method: 'POST',
      url: 'https://www.googleapis.com/drive/v3/files',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: `[kanNINJA] ${title}`,
        mimeType: 'application/vnd.google-apps.document',
        description: description ?? '',
        ...(folderId ? { parents: [folderId] } : {}),
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
      throw new Error(`Google Drive API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const folderId = config.folderId as string;
    const query = folderId ? `'${folderId}' in parents` : 'trashed = false';
    const params = new URLSearchParams({
      q: query,
      pageSize: '50',
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink)',
    });
    if (cursor) params.set('pageToken', cursor);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Google Drive sync failed (${res.status})`);

    const data = (await res.json()) as {
      files: unknown[];
      nextPageToken?: string;
    };

    return {
      processed: data.files.length,
      cursor: data.nextPageToken,
      errors: [],
    };
  },
};

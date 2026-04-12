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
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
];

export const gmailProvider: IntegrationProvider = {
  id: 'gmail',
  name: 'Gmail',
  requiredTier: 'pro',

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
    // Gmail push notifications use Google Cloud Pub/Sub.
    // Verification happens at the Pub/Sub subscription level.
    const subscription = headers['x-goog-subscription'];
    return !!subscription;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      message?: {
        data?: string; // base64-encoded
      };
    };

    if (!event.message?.data) return null;

    // Pub/Sub message data contains { emailAddress, historyId }
    // Actual email fetching happens via sync(), not directly here.
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const notifyEmail = config.notifyEmail as string;
    if (!notifyEmail) return null;

    const title = event.data.title as string;

    // Gmail API requires base64url-encoded RFC 2822 message
    const message = [
      `To: ${notifyEmail}`,
      'Subject: [kanNINJA] Card Completed',
      'Content-Type: text/plain; charset=utf-8',
      '',
      `Card "${title}" has been completed in kanNINJA.`,
    ].join('\r\n');

    const encoded = Buffer.from(message).toString('base64url');

    return {
      method: 'POST',
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      headers: { 'Content-Type': 'application/json' },
      body: { raw: encoded },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Gmail API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const params = new URLSearchParams({
      maxResults: '20',
      q: 'label:kanninja',
    });
    if (cursor) params.set('pageToken', cursor);

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Gmail sync failed (${res.status})`);

    const data = (await res.json()) as {
      messages?: unknown[];
      nextPageToken?: string;
    };

    return {
      processed: data.messages?.length ?? 0,
      cursor: data.nextPageToken,
      errors: [],
    };
  },
};

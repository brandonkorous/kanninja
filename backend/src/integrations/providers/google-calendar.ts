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
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export const googleCalendarProvider: IntegrationProvider = {
  id: 'google_calendar',
  name: 'Google Calendar',
  requiredTier: 'free',

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

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google token exchange failed: ${err}`);
    }

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
    // Google Calendar push notifications use channel-based verification.
    // The X-Goog-Channel-Token header contains our verification token
    // set during channel watch registration.
    const token = headers['x-goog-channel-token'];
    if (!token) return false;
    // In production, verify this matches the token we set when creating
    // the watch channel. For now, accept if the header is present.
    return token.startsWith('kanninja_');
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    // Google Calendar push notifications are sparse — they just tell us
    // "something changed" on a calendar. The actual sync happens via the
    // sync() method. So on inbound webhook, we return null (no direct
    // action) and let the system trigger a sync instead.
    // Full inbound mapping requires a sync-then-diff approach in Phase 3.
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    // Only handle card events that have a due date
    if (event.type !== 'card.created' && event.type !== 'card.updated') return null;

    const dueDate = event.data.dueDate as string | undefined;
    if (!dueDate) return null;

    const calendarId = (config.calendarId as string) || 'primary';
    const title = event.data.title as string;
    const description = event.data.description as string | undefined;

    const startDate = new Date(dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour

    return {
      method: 'POST',
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        summary: `[kanNINJA] ${title}`,
        description: description ?? '',
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar API error (${res.status}): ${err}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const calendarId = (config.calendarId as string) || 'primary';
    const params = new URLSearchParams({ maxResults: '50', singleEvents: 'true' });
    if (cursor) params.set('pageToken', cursor);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Google Calendar sync failed (${res.status})`);

    const data = (await res.json()) as {
      items: unknown[];
      nextPageToken?: string;
    };

    return {
      processed: data.items.length,
      cursor: data.nextPageToken,
      errors: [],
    };
  },
};

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

const SCOPES = ['Calendars.ReadWrite', 'offline_access'];

export const outlookProvider: IntegrationProvider = {
  id: 'outlook',
  name: 'Outlook Calendar',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const tenant = env.MICROSOFT_TENANT_ID || 'common';
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
    });
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const tenant = env.MICROSOFT_TENANT_ID || 'common';
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      },
    );

    if (!res.ok) throw new Error(`Microsoft token exchange failed: ${await res.text()}`);

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
    const tenant = env.MICROSOFT_TENANT_ID || 'common';
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      },
    );

    if (!res.ok) throw new Error('Microsoft token refresh failed');

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

  // --- Inbound ---
  verifyWebhook(_payload, headers): boolean {
    const clientState = headers['clientstate'];
    return !!clientState && clientState.startsWith('kanninja_');
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    // Outlook change notifications are sparse (like Google Calendar).
    // Triggers a sync rather than a direct action.
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.created' && event.type !== 'card.updated') return null;

    const dueDate = event.data.dueDate as string | undefined;
    if (!dueDate) return null;

    const calendarId = (config.calendarId as string) || 'me';
    const title = event.data.title as string;
    const description = event.data.description as string | undefined;

    const start = new Date(dueDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return {
      method: 'POST',
      url: `https://graph.microsoft.com/v1.0/${calendarId}/events`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        subject: `[kanNINJA] ${title}`,
        body: { contentType: 'text', content: description ?? '' },
        start: { dateTime: start.toISOString(), timeZone: 'UTC' },
        end: { dateTime: end.toISOString(), timeZone: 'UTC' },
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
      throw new Error(`Outlook API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const params = new URLSearchParams({ $top: '50' });
    if (cursor) params.set('$skiptoken', cursor);

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Outlook sync failed (${res.status})`);

    const data = (await res.json()) as {
      value: unknown[];
      '@odata.nextLink'?: string;
    };

    const nextLink = data['@odata.nextLink'];
    const nextCursor = nextLink ? new URL(nextLink).searchParams.get('$skiptoken') ?? undefined : undefined;

    return { processed: data.value.length, cursor: nextCursor, errors: [] };
  },
};

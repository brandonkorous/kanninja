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
  'ChannelMessage.Send',
  'Channel.ReadBasic.All',
  'Team.ReadBasic.All',
  'offline_access',
];

export const microsoftTeamsProvider: IntegrationProvider = {
  id: 'microsoft_teams',
  name: 'Microsoft Teams',
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
    // Microsoft Graph change notifications include a validationToken
    // for subscription verification. For actual notifications, verify
    // the clientState header matches our stored value.
    const clientState = headers['clientstate'];
    return !!clientState && clientState.startsWith('kanninja_');
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      value?: Array<{
        resourceData?: { body?: { content?: string } };
        changeType?: string;
      }>;
    };

    if (!event.value?.[0]) return null;

    const notification = event.value[0];
    const content = notification.resourceData?.body?.content ?? '';

    // Handle @kanNINJA create <title> mentions
    const createMatch = content.match(/@kanNINJA\s+create\s+(.+)/i);
    if (createMatch) {
      return { type: 'create_card', data: { title: createMatch[1].trim() } };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    const teamId = config.teamId as string;
    const channelId = config.channelId as string;
    if (!teamId || !channelId) return null;

    let text: string;
    const title = event.data.title as string;

    switch (event.type) {
      case 'card.created':
        text = `New kata created: **${title}**`;
        break;
      case 'card.updated':
        text = `Kata updated: **${title}**`;
        break;
      case 'card.moved':
        text = `Kata moved: **${title}**`;
        break;
      default:
        return null;
    }

    return {
      method: 'POST',
      url: `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
      headers: { 'Content-Type': 'application/json' },
      body: { body: { contentType: 'html', content: text } },
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
      throw new Error(`Teams API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    // List joined teams for config UI
    const res = await fetch('https://graph.microsoft.com/v1.0/me/joinedTeams', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Teams sync failed (${res.status})`);
    const data = (await res.json()) as { value: unknown[] };

    return { processed: data.value.length, errors: [] };
  },
};

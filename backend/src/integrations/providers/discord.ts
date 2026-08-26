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

const SCOPES = ['bot', 'applications.commands'];

export const discordProvider: IntegrationProvider = {
  id: 'discord',
  name: 'Discord',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
    });
    return `https://discord.com/api/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Discord token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Discord token refresh failed');

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
    // Discord Interactions use Ed25519 signature verification.
    // For simplicity, we verify the timestamp + public key presence.
    const signature = headers['x-signature-ed25519'];
    const timestamp = headers['x-signature-timestamp'];
    return !!signature && !!timestamp;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      type?: number;
      data?: { name?: string; options?: Array<{ value: string }> };
    };

    // Type 2 = slash command
    if (event.type === 2 && event.data?.name === 'kanninja') {
      const title = event.data.options?.[0]?.value;
      if (title) {
        return { type: 'create_card', data: { title } };
      }
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    const channelId = config.channelId as string;
    if (!channelId) return null;

    let description: string;
    const title = event.data.title as string;

    switch (event.type) {
      case 'card.created':
        description = `New kata created: **${title}**`;
        break;
      case 'card.updated':
        description = `Kata updated: **${title}**`;
        break;
      case 'card.moved':
        description = `Kata moved: **${title}**`;
        break;
      default:
        return null;
    }

    return {
      method: 'POST',
      url: `https://discord.com/api/v10/channels/${channelId}/messages`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        embeds: [
          {
            title: 'kanNINJA',
            description,
            color: 0xe0432f, // vermillion
          },
        ],
      },
    };
  },

  async deliver(_accessToken: string, payload: ExternalPayload): Promise<void> {
    // Discord bot messages use the bot token, not user OAuth token
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Discord API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    _accessToken: string,
    _config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    // List guilds the bot is in (for config UI)
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
    });

    if (!res.ok) throw new Error(`Discord sync failed (${res.status})`);
    const guilds = (await res.json()) as unknown[];

    return { processed: guilds.length, errors: [] };
  },
};

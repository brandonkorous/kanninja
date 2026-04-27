import { createHmac } from 'node:crypto';
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

const SCOPES = ['channels:read', 'chat:write', 'commands'];

export const slackProvider: IntegrationProvider = {
  id: 'slack',
  name: 'Slack',
  requiredTier: 'pro',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES.join(','),
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    const data = (await res.json()) as {
      ok: boolean;
      access_token: string;
      error?: string;
    };

    if (!data.ok) {
      throw new Error(`Slack token exchange failed: ${data.error}`);
    }

    return {
      accessToken: data.access_token,
      // Slack bot tokens don't expire
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    // Slack bot tokens don't expire and don't need refresh
    throw new Error('Slack tokens do not require refresh');
  },

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch('https://slack.com/api/auth.revoke', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    // Slack uses signing secret verification via X-Slack-Signature
    // Full implementation requires HMAC-SHA256 of timestamp + body
    const signature = headers['x-slack-signature'];
    const timestamp = headers['x-slack-request-timestamp'];
    if (!signature || !timestamp) return false;

    // Reject requests older than 5 minutes (replay protection)
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (age > 300) return false;

    const baseString = `v0:${timestamp}:${typeof payload === 'string' ? payload : payload.toString()}`;
    const expectedSig = 'v0=' + createHmac('sha256', env.SLACK_SIGNING_SECRET)
      .update(baseString)
      .digest('hex');

    return signature === expectedSig;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      type?: string;
      command?: string;
      text?: string;
      channel_id?: string;
    };

    // Handle slash commands (e.g., /kanninja create Buy groceries)
    if (event.command === '/kanninja' && event.text) {
      const parts = event.text.trim().split(/\s+/);
      const subcommand = parts[0];
      const rest = parts.slice(1).join(' ');

      if (subcommand === 'create' && rest) {
        return {
          type: 'create_card',
          data: {
            title: rest,
            // listId must be resolved from provider config
            // (which Slack channel maps to which board/list)
          },
        };
      }
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    const channel = config.channelId as string;
    if (!channel) return null;

    let text: string;
    const title = event.data.title as string;

    switch (event.type) {
      case 'card.created':
        text = `New kata created: *${title}*`;
        break;
      case 'card.updated':
        text = `Kata updated: *${title}*`;
        break;
      case 'card.moved':
        text = `Kata moved: *${title}* → ${event.data.listId}`;
        break;
      default:
        return null;
    }

    return {
      method: 'POST',
      url: 'https://slack.com/api/chat.postMessage',
      headers: { 'Content-Type': 'application/json' },
      body: { channel, text, unfurl_links: false },
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

    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    // Slack sync: list channels the bot is in (for config UI)
    const res = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = (await res.json()) as {
      ok: boolean;
      channels: Array<{ id: string; name: string }>;
    };

    if (!data.ok) throw new Error('Slack channel sync failed');

    return {
      processed: data.channels.length,
      errors: [],
    };
  },
};

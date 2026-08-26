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

export const notionProvider: IntegrationProvider = {
  id: 'notion',
  name: 'Notion',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.NOTION_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      owner: 'user',
      state,
    });
    return `https://api.notion.com/v1/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) throw new Error(`Notion token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as {
      access_token: string;
      workspace_name: string;
    };

    // Notion tokens don't expire
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Notion tokens do not expire');
  },

  // --- Inbound ---
  verifyWebhook(_payload, _headers): boolean {
    // Notion doesn't have public webhooks yet — use polling via sync()
    return false;
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.created') return null;

    const databaseId = config.databaseId as string;
    if (!databaseId) return null;

    const title = event.data.title as string;
    const description = event.data.description as string | undefined;

    return {
      method: 'POST',
      url: 'https://api.notion.com/v1/pages',
      headers: {
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: {
        parent: { database_id: databaseId },
        properties: {
          title: { title: [{ text: { content: title } }] },
        },
        children: description
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [{ text: { content: description } }],
                },
              },
            ]
          : [],
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
      throw new Error(`Notion API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const databaseId = config.databaseId as string;
    if (!databaseId) return { processed: 0, errors: ['No database configured'] };

    const res = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          page_size: 50,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      },
    );

    if (!res.ok) throw new Error(`Notion sync failed (${res.status})`);

    const data = (await res.json()) as {
      results: unknown[];
      has_more: boolean;
      next_cursor?: string;
    };

    return {
      processed: data.results.length,
      cursor: data.has_more ? data.next_cursor : undefined,
      errors: [],
    };
  },
};

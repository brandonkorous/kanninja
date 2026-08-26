import { env } from '../../config/env.js';
import { createHmac } from 'node:crypto';
import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

export const intercomProvider: IntegrationProvider = {
  id: 'intercom',
  name: 'Intercom',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.INTERCOM_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://app.intercom.com/oauth?${params}`;
  },

  async exchangeCode(code: string, _redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.intercom.io/auth/eagle/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.INTERCOM_CLIENT_ID,
        client_secret: env.INTERCOM_CLIENT_SECRET,
      }),
    });

    if (!res.ok) throw new Error(`Intercom token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as { token: string };

    // Intercom access tokens don't expire
    return {
      accessToken: data.token,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Intercom tokens do not expire');
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    // Intercom uses HMAC-SHA1 with client secret
    const signature = headers['x-hub-signature'];
    if (!signature) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const expected =
      'sha1=' +
      createHmac('sha1', env.INTERCOM_CLIENT_SECRET).update(body).digest('hex');

    return signature === expected;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      topic?: string;
      data?: {
        item?: {
          id?: string;
          type?: string;
          source?: { body?: string; subject?: string };
          conversation_message?: { body?: string; subject?: string };
        };
      };
    };

    if (!event.data?.item) return null;

    // New conversation → create card
    if (event.topic === 'conversation.created') {
      const item = event.data.item;
      const subject =
        item.conversation_message?.subject ??
        item.source?.subject ??
        'Intercom Conversation';
      const body = item.conversation_message?.body ?? item.source?.body ?? '';

      return {
        type: 'create_card',
        data: {
          title: subject,
          description: body.replace(/<[^>]*>/g, '').slice(0, 500), // Strip HTML
          intercomConversationId: item.id,
        },
      };
    }

    // Conversation closed → mark card complete
    if (event.topic === 'conversation.admin.closed') {
      return {
        type: 'update_card',
        data: {
          isCompleted: true,
          intercomConversationId: event.data.item.id,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const conversationId = event.data.intercomConversationId as string | undefined;
    if (!conversationId) return null;

    return {
      method: 'POST',
      url: `https://api.intercom.io/conversations/${conversationId}/parts`,
      headers: {
        'Content-Type': 'application/json',
        'Intercom-Version': '2.11',
      },
      body: {
        message_type: 'close',
        type: 'admin',
        body: 'Resolved via kanNINJA.',
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
      throw new Error(`Intercom API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    _config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const body: Record<string, unknown> = {
      query: { operator: 'AND', value: [{ field: 'open', operator: '=', value: true }] },
    };
    if (cursor) {
      body.pagination = { starting_after: cursor };
    }

    const res = await fetch('https://api.intercom.io/conversations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Intercom-Version': '2.11',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Intercom sync failed (${res.status})`);

    const data = (await res.json()) as {
      conversations: unknown[];
      pages?: { next?: { starting_after?: string } };
    };

    return {
      processed: data.conversations.length,
      cursor: data.pages?.next?.starting_after,
      errors: [],
    };
  },
};

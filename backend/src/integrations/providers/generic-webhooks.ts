import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

export const genericWebhooksProvider: IntegrationProvider = {
  id: 'generic_webhooks',
  name: 'Webhooks',
  requiredTier: 'pro',

  getAuthUrl(_state: string, _redirectUri: string): string {
    // No OAuth — direct connection with auto-generated secret.
    // The service layer handles this by creating the connection directly.
    return '';
  },

  async exchangeCode(_code: string, _redirectUri: string): Promise<TokenSet> {
    // No OAuth — generate a webhook secret as the "token"
    const secret = randomBytes(32).toString('hex');
    return {
      accessToken: secret,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Webhook secrets do not require refresh');
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    const signature = headers['x-kanninja-signature'];
    const secret = headers['x-webhook-secret'];
    if (!signature || !secret) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const expected = createHmac('sha256', secret).update(body).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      action?: string;
      data?: Record<string, unknown>;
    };

    if (!event.action || !event.data) return null;

    switch (event.action) {
      case 'create_card':
        return { type: 'create_card', data: event.data };
      case 'update_card':
        return {
          type: 'update_card',
          cardId: event.data.cardId as string,
          data: event.data,
        };
      case 'move_card':
        return {
          type: 'move_card',
          cardId: event.data.cardId as string,
          data: event.data,
        };
      case 'add_comment':
        return {
          type: 'add_comment',
          cardId: event.data.cardId as string,
          data: event.data,
        };
      default:
        return null;
    }
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    const webhookUrl = config.webhookUrl as string;
    if (!webhookUrl) return null;

    return {
      method: 'POST',
      url: webhookUrl,
      headers: { 'Content-Type': 'application/json' },
      body: {
        event: event.type,
        boardId: event.boardId,
        cardId: event.cardId,
        listId: event.listId,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const body = JSON.stringify(payload.body);
    const signature = createHmac('sha256', accessToken).update(body).digest('hex');

    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        'X-KanNinja-Signature': signature,
        'User-Agent': 'kanNINJA-Webhooks',
      },
      body,
    });

    if (!res.ok) {
      throw new Error(`Webhook delivery failed (${res.status})`);
    }
  },

  async sync(
    _accessToken: string,
    _config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    // No sync needed for generic webhooks
    return { processed: 0, errors: [] };
  },
};

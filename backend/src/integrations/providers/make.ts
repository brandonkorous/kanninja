import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

/**
 * Make (Integromat) integration — same pattern as Zapier.
 * Uses API key auth and webhook subscriptions for triggers.
 */
export const makeProvider: IntegrationProvider = {
  id: 'make',
  name: 'Make',
  requiredTier: 'clan',

  getAuthUrl(_state: string, _redirectUri: string): string {
    return '';
  },

  async exchangeCode(_code: string, _redirectUri: string): Promise<TokenSet> {
    return {
      accessToken: '',
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Make API keys do not require refresh');
  },

  // --- Inbound ---
  verifyWebhook(_payload, headers): boolean {
    const apiKey = headers['x-api-key'];
    return !!apiKey;
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
    const hookUrl = config.hookUrl as string;
    if (!hookUrl) return null;

    const subscribedEvents = (config.events as string[]) ?? [];
    if (subscribedEvents.length > 0 && !subscribedEvents.includes(event.type)) {
      return null;
    }

    return {
      method: 'POST',
      url: hookUrl,
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

  async deliver(_accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        'User-Agent': 'kanNINJA-Make',
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Make hook delivery failed (${res.status})`);
    }
  },

  async sync(
    _accessToken: string,
    _config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    return { processed: 0, errors: [] };
  },
};

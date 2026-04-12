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
 * Zapier integration uses API key auth (not OAuth).
 * Triggers: kanNINJA events → REST Hook subscriptions → Zapier
 * Actions: Zapier → kanNINJA API endpoints (using API key)
 */
export const zapierProvider: IntegrationProvider = {
  id: 'zapier',
  name: 'Zapier',
  requiredTier: 'pro',

  getAuthUrl(_state: string, _redirectUri: string): string {
    // Zapier uses API key auth, not OAuth.
    // Connection is created directly via the settings UI.
    return '';
  },

  async exchangeCode(_code: string, _redirectUri: string): Promise<TokenSet> {
    // API key is stored as the access token
    return {
      accessToken: '',
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Zapier API keys do not require refresh');
  },

  // --- Inbound ---
  verifyWebhook(_payload, headers): boolean {
    // Zapier actions hit kanNINJA's standard API with an API key.
    // Verification happens via the API key middleware, not here.
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

    // Only send events the Zap subscribed to
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
        'User-Agent': 'kanNINJA-Zapier',
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Zapier hook delivery failed (${res.status})`);
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

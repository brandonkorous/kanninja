import type { SubscriptionTier } from '@kanninja/shared';

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface IntegrationAction {
  type: 'move_card' | 'create_card' | 'update_card' | 'add_comment';
  boardId?: string;
  cardId?: string;
  data: Record<string, unknown>;
}

export interface SyncResult {
  processed: number;
  cursor?: string;
  errors: string[];
}

export type ProviderConfig = Record<string, unknown>;

export interface ExternalPayload {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface KanNinjaEvent {
  type: string;
  boardId: string;
  cardId?: string;
  listId?: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: Date;
}

export interface IntegrationProvider {
  readonly id: string;
  readonly name: string;
  readonly requiredTier: SubscriptionTier;

  // OAuth lifecycle
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>;
  refreshTokens(refreshToken: string): Promise<TokenSet>;
  revokeTokens?(accessToken: string): Promise<void>;

  // Inbound (external → kanNINJA)
  verifyWebhook(payload: Buffer | string, headers: Record<string, string>): boolean;
  mapInbound(rawEvent: unknown): IntegrationAction | null;

  // Outbound (kanNINJA → external)
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null;
  deliver(accessToken: string, payload: ExternalPayload): Promise<void>;

  // Sync
  sync(accessToken: string, config: ProviderConfig, cursor?: string): Promise<SyncResult>;
}

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

export const figmaProvider: IntegrationProvider = {
  id: 'figma',
  name: 'Figma',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.FIGMA_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'files:read',
      state,
    });
    return `https://www.figma.com/oauth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.FIGMA_CLIENT_ID,
        client_secret: env.FIGMA_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Figma token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://api.figma.com/v1/oauth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.FIGMA_CLIENT_ID,
        client_secret: env.FIGMA_CLIENT_SECRET,
      }),
    });

    if (!res.ok) throw new Error('Figma token refresh failed');

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  },

  // --- Inbound ---
  verifyWebhook(payload, _headers): boolean {
    // Figma webhooks include a passcode set during subscription creation
    const event = (typeof payload === 'string' ? JSON.parse(payload) : payload) as {
      passcode?: string;
    };
    return !!event.passcode;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      event_type?: string;
      file_key?: string;
      file_name?: string;
      timestamp?: string;
      triggered_by?: { handle?: string };
      comment?: Array<{ message?: string }>;
    };

    // File updated — add comment to linked cards
    if (event.event_type === 'FILE_UPDATE' && event.file_key) {
      return {
        type: 'add_comment',
        data: {
          content: `Figma file "${event.file_name}" was updated by ${event.triggered_by?.handle ?? 'someone'}.`,
          figmaFileKey: event.file_key,
        },
      };
    }

    // Comment added on Figma file
    if (event.event_type === 'FILE_COMMENT' && event.comment?.[0]) {
      return {
        type: 'add_comment',
        data: {
          content: `Figma comment: ${event.comment[0].message}`,
          figmaFileKey: event.file_key,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(_event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    // Figma is read-only for external apps
    return null;
  },

  async deliver(_accessToken: string, _payload: ExternalPayload): Promise<void> {
    // No outbound delivery — Figma is read-only
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const teamId = config.teamId as string;
    if (!teamId) return { processed: 0, errors: ['No team configured'] };

    const res = await fetch(
      `https://api.figma.com/v1/teams/${teamId}/projects`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Figma sync failed (${res.status})`);

    const data = (await res.json()) as { projects: unknown[] };

    return { processed: data.projects.length, errors: [] };
  },
};

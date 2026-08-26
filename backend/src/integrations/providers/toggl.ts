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
 * Toggl Track uses API key auth (not OAuth).
 * Users provide their personal API token from Toggl settings.
 */
export const togglProvider: IntegrationProvider = {
  id: 'toggl',
  name: 'Toggl Track',
  requiredTier: 'clan',

  getAuthUrl(_state: string, _redirectUri: string): string {
    // Toggl uses API key auth — no OAuth flow.
    // User provides their API token in the config modal.
    return '';
  },

  async exchangeCode(code: string, _redirectUri: string): Promise<TokenSet> {
    // The "code" is actually the user's Toggl API token
    return {
      accessToken: code,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Toggl API tokens do not expire');
  },

  // --- Inbound ---
  verifyWebhook(_payload, _headers): boolean {
    // Toggl has no webhooks — uses polling via sync()
    return false;
  },

  mapInbound(_rawEvent): IntegrationAction | null {
    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    // Start a Toggl time entry when a card is updated (timer start event)
    if (event.type !== 'card.updated') return null;

    const timerStarted = event.data.timerStarted as boolean | undefined;
    if (!timerStarted) return null;

    const workspaceId = config.workspaceId as string;
    if (!workspaceId) return null;

    const title = event.data.title as string;
    const projectId = config.projectId as number | undefined;

    return {
      method: 'POST',
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/time_entries`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        description: `[kanNINJA] ${title}`,
        workspace_id: parseInt(workspaceId, 10),
        ...(projectId ? { project_id: projectId } : {}),
        start: new Date().toISOString(),
        duration: -1, // Running timer
        created_with: 'kanNINJA',
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    // Toggl uses Basic auth with API token
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        Authorization: `Basic ${Buffer.from(`${accessToken}:api_token`).toString('base64')}`,
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Toggl API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const workspaceId = config.workspaceId as string;
    if (!workspaceId) return { processed: 0, errors: ['No workspace configured'] };

    // Fetch recent time entries (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(
      `https://api.track.toggl.com/api/v9/me/time_entries?since=${since}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accessToken}:api_token`).toString('base64')}`,
        },
      },
    );

    if (!res.ok) throw new Error(`Toggl sync failed (${res.status})`);
    const entries = (await res.json()) as unknown[];

    return { processed: entries.length, errors: [] };
  },
};

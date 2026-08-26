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

export const gitlabProvider: IntegrationProvider = {
  id: 'gitlab',
  name: 'GitLab',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const baseUrl = env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
    const params = new URLSearchParams({
      client_id: env.GITLAB_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'api',
      state,
    });
    return `${baseUrl}/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const baseUrl = env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITLAB_CLIENT_ID,
        client_secret: env.GITLAB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`GitLab token exchange failed: ${await res.text()}`);

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
    const baseUrl = env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITLAB_CLIENT_ID,
        client_secret: env.GITLAB_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('GitLab token refresh failed');

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
    // GitLab uses a simple secret token header (not HMAC)
    const token = headers['x-gitlab-token'];
    return !!token;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      object_kind?: string;
      object_attributes?: {
        state?: string;
        action?: string;
        title?: string;
        url?: string;
        description?: string;
      };
    };

    const attrs = event.object_attributes;
    if (!attrs) return null;

    // MR merged
    if (event.object_kind === 'merge_request' && attrs.action === 'merge') {
      const cardMatch = attrs.description?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'add_comment',
          cardId: cardMatch[1],
          data: { content: `MR merged: [${attrs.title}](${attrs.url})` },
        };
      }
    }

    // MR opened
    if (event.object_kind === 'merge_request' && attrs.action === 'open') {
      const cardMatch = attrs.description?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'add_comment',
          cardId: cardMatch[1],
          data: { content: `MR opened: [${attrs.title}](${attrs.url})` },
        };
      }
    }

    // Issue closed
    if (event.object_kind === 'issue' && attrs.action === 'close') {
      const cardMatch = attrs.description?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'update_card',
          cardId: cardMatch[1],
          data: { isCompleted: true },
        };
      }
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    const project = config.project as string;
    if (!project) return null;

    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const baseUrl = env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
    const title = event.data.title as string;

    return {
      method: 'POST',
      url: `${baseUrl}/api/v4/projects/${encodeURIComponent(project)}/issues`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: `[kanNINJA] Completed: ${title}`,
        description: `Card "${title}" was marked as complete in kanNINJA.`,
        labels: 'kanninja',
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
      throw new Error(`GitLab API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const project = config.project as string;
    if (!project) return { processed: 0, errors: ['No project configured'] };

    const baseUrl = env.GITLAB_INSTANCE_URL || 'https://gitlab.com';
    const res = await fetch(
      `${baseUrl}/api/v4/projects/${encodeURIComponent(project)}/issues?state=opened&per_page=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`GitLab sync failed (${res.status})`);
    const issues = (await res.json()) as unknown[];

    return { processed: issues.length, errors: [] };
  },
};

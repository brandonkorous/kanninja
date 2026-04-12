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

const SCOPES = ['read:jira-work', 'read:jira-user', 'write:jira-work', 'offline_access'];

export const jiraProvider: IntegrationProvider = {
  id: 'jira',
  name: 'Jira',
  requiredTier: 'free',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.ATLASSIAN_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
      audience: 'api.atlassian.com',
      prompt: 'consent',
    });
    return `https://auth.atlassian.com/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.ATLASSIAN_CLIENT_ID,
        client_secret: env.ATLASSIAN_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Atlassian token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: env.ATLASSIAN_CLIENT_ID,
        client_secret: env.ATLASSIAN_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Atlassian token refresh failed');

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
    // Atlassian Connect webhooks use JWT in Authorization header
    const auth = headers['authorization'];
    return !!auth && auth.startsWith('JWT ');
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      webhookEvent?: string;
      issue?: {
        key?: string;
        fields?: {
          summary?: string;
          description?: string;
          status?: { name?: string; statusCategory?: { key?: string } };
          priority?: { name?: string };
        };
      };
    };

    if (!event.issue?.fields) return null;

    // Issue created → create card
    if (event.webhookEvent === 'jira:issue_created') {
      return {
        type: 'create_card',
        data: {
          title: event.issue.fields.summary ?? event.issue.key ?? 'Jira Issue',
          description: event.issue.fields.description,
          jiraKey: event.issue.key,
        },
      };
    }

    // Issue status changed to Done → mark card complete
    if (
      event.webhookEvent === 'jira:issue_updated' &&
      event.issue.fields.status?.statusCategory?.key === 'done'
    ) {
      return {
        type: 'update_card',
        data: {
          isCompleted: true,
          jiraKey: event.issue.key,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const cloudId = config.cloudId as string;
    const jiraKey = event.data.jiraKey as string | undefined;
    if (!cloudId || !jiraKey) return null;

    // Transition issue to "Done"
    return {
      method: 'POST',
      url: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${jiraKey}/transitions`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        transition: { id: '31' }, // Done transition ID — varies by project
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Jira API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const cloudId = config.cloudId as string;
    const projectKey = config.projectKey as string;
    if (!cloudId || !projectKey) {
      return { processed: 0, errors: ['No Jira project configured'] };
    }

    const startAt = cursor ? parseInt(cursor, 10) : 0;
    const jql = encodeURIComponent(`project = ${projectKey} ORDER BY created DESC`);

    const res = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${jql}&startAt=${startAt}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Jira sync failed (${res.status})`);

    const data = (await res.json()) as {
      issues: unknown[];
      total: number;
    };

    const nextStart = startAt + data.issues.length;
    const hasMore = nextStart < data.total;

    return {
      processed: data.issues.length,
      cursor: hasMore ? String(nextStart) : undefined,
      errors: [],
    };
  },
};

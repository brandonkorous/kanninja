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

const SCOPES = ['repository', 'pullrequest', 'issue', 'webhook'];

export const bitbucketProvider: IntegrationProvider = {
  id: 'bitbucket',
  name: 'Bitbucket',
  requiredTier: 'pro',

  getAuthUrl(state: string, _redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.ATLASSIAN_CLIENT_ID,
      response_type: 'code',
      scope: SCOPES.join(' '),
      state,
    });
    return `https://bitbucket.org/site/oauth2/authorize?${params}`;
  },

  async exchangeCode(code: string, _redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${env.ATLASSIAN_CLIENT_ID}:${env.ATLASSIAN_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Bitbucket token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${env.ATLASSIAN_CLIENT_ID}:${env.ATLASSIAN_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Bitbucket token refresh failed');

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
    // Bitbucket Cloud doesn't support webhook signatures.
    // Verify by checking the user-agent and event header.
    const userAgent = headers['user-agent'] ?? '';
    const event = headers['x-event-key'];
    return userAgent.includes('Bitbucket') && !!event;
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      pullrequest?: {
        state?: string;
        title?: string;
        links?: { html?: { href?: string } };
        description?: string;
      };
      issue?: {
        state?: string;
        title?: string;
        content?: { raw?: string };
      };
    };

    // PR merged
    if (event.pullrequest?.state === 'MERGED') {
      const pr = event.pullrequest;
      const cardMatch = pr.description?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'add_comment',
          cardId: cardMatch[1],
          data: { content: `PR merged: [${pr.title}](${pr.links?.html?.href})` },
        };
      }
    }

    // Issue resolved
    if (event.issue?.state === 'resolved') {
      const cardMatch = event.issue.content?.raw?.match(/\[card:([a-f0-9-]+)\]/i);
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
    const workspace = config.workspace as string;
    const repoSlug = config.repoSlug as string;
    if (!workspace || !repoSlug) return null;

    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const title = event.data.title as string;

    return {
      method: 'POST',
      url: `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/issues`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: `[kanNINJA] Completed: ${title}`,
        content: { raw: `Card "${title}" was marked as complete in kanNINJA.` },
        kind: 'task',
        priority: 'minor',
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
      throw new Error(`Bitbucket API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const workspace = config.workspace as string;
    const repoSlug = config.repoSlug as string;
    if (!workspace || !repoSlug) return { processed: 0, errors: ['No repo configured'] };

    const res = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/issues?state=open&pagelen=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Bitbucket sync failed (${res.status})`);
    const data = (await res.json()) as { values: unknown[] };

    return { processed: data.values.length, errors: [] };
  },
};

import { env } from '../../config/env.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  IntegrationProvider,
  TokenSet,
  IntegrationAction,
  ExternalPayload,
  KanNinjaEvent,
  ProviderConfig,
  SyncResult,
} from '../types.js';

const SCOPES = ['repo', 'read:org'];

export const githubProvider: IntegrationProvider = {
  id: 'github',
  name: 'GitHub',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES.join(' '),
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, _redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = (await res.json()) as {
      access_token: string;
      error?: string;
      error_description?: string;
    };

    if (data.error) {
      throw new Error(`GitHub token exchange failed: ${data.error_description}`);
    }

    return {
      accessToken: data.access_token,
      // GitHub OAuth tokens don't expire unless revoked
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    // GitHub OAuth tokens don't expire
    throw new Error('GitHub tokens do not require refresh');
  },

  async revokeTokens(accessToken: string): Promise<void> {
    await fetch(
      `https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      },
    );
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    const signature = headers['x-hub-signature-256'];
    if (!signature) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const expected =
      'sha256=' +
      createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      action?: string;
      pull_request?: {
        merged: boolean;
        title: string;
        html_url: string;
        body?: string;
      };
      issue?: {
        title: string;
        html_url: string;
        state: string;
        body?: string;
      };
    };

    // PR merged → add comment to linked card
    if (event.action === 'closed' && event.pull_request?.merged) {
      const pr = event.pull_request;
      // Look for card ID in PR body (e.g., "Closes KAN-123" or "[card:uuid]")
      const cardMatch = pr.body?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'add_comment',
          cardId: cardMatch[1],
          data: {
            content: `PR merged: [${pr.title}](${pr.html_url})`,
          },
        };
      }
    }

    // PR opened → add comment
    if (event.action === 'opened' && event.pull_request) {
      const pr = event.pull_request;
      const cardMatch = pr.body?.match(/\[card:([a-f0-9-]+)\]/i);
      if (cardMatch) {
        return {
          type: 'add_comment',
          cardId: cardMatch[1],
          data: {
            content: `PR opened: [${pr.title}](${pr.html_url})`,
          },
        };
      }
    }

    // Issue closed → update card as completed
    if (event.action === 'closed' && event.issue) {
      const issue = event.issue;
      const cardMatch = issue.body?.match(/\[card:([a-f0-9-]+)\]/i);
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
    const repo = config.repository as string;
    if (!repo) return null;

    // Only post comments for completed cards
    if (event.type !== 'card.updated') return null;
    if (!event.data.isCompleted) return null;

    const title = event.data.title as string;

    return {
      method: 'POST',
      url: `https://api.github.com/repos/${repo}/issues`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: {
        title: `[kanNINJA] Completed: ${title}`,
        body: `Card "${title}" was marked as complete in kanNINJA.`,
        labels: ['kanninja'],
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: {
        ...payload.headers,
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'kanNINJA-Integration',
      },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API error (${res.status}): ${err}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    _cursor?: string,
  ): Promise<SyncResult> {
    const repo = config.repository as string;
    if (!repo) return { processed: 0, errors: ['No repository configured'] };

    // Sync: fetch recent issues for the config UI
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=open&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'kanNINJA-Integration',
        },
      },
    );

    if (!res.ok) throw new Error(`GitHub sync failed (${res.status})`);

    const issues = (await res.json()) as unknown[];

    return {
      processed: issues.length,
      errors: [],
    };
  },
};

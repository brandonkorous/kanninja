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

export const linearProvider: IntegrationProvider = {
  id: 'linear',
  name: 'Linear',
  requiredTier: 'free',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.LINEAR_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read,write',
      state,
      prompt: 'consent',
    });
    return `https://linear.app/oauth/authorize?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.LINEAR_CLIENT_ID,
        client_secret: env.LINEAR_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Linear token exchange failed: ${await res.text()}`);

    const data = (await res.json()) as { access_token: string };

    // Linear tokens don't expire
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    };
  },

  async refreshTokens(_refreshToken: string): Promise<TokenSet> {
    throw new Error('Linear tokens do not expire');
  },

  // --- Inbound ---
  verifyWebhook(payload, headers): boolean {
    const signature = headers['linear-signature'];
    if (!signature || !env.LINEAR_CLIENT_SECRET) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const expected = createHmac('sha256', env.LINEAR_CLIENT_SECRET)
      .update(body)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      type?: string;
      action?: string;
      data?: {
        id?: string;
        title?: string;
        description?: string;
        state?: { name?: string; type?: string };
        priority?: number;
      };
    };

    // Issue created in Linear → create card
    if (event.type === 'Issue' && event.action === 'create' && event.data) {
      return {
        type: 'create_card',
        data: {
          title: event.data.title ?? 'Untitled',
          description: event.data.description,
          linearIssueId: event.data.id,
        },
      };
    }

    // Issue status changed to Done → update card
    if (
      event.type === 'Issue' &&
      event.action === 'update' &&
      event.data?.state?.type === 'completed'
    ) {
      return {
        type: 'update_card',
        data: {
          isCompleted: true,
          linearIssueId: event.data.id,
        },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, _config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const linearIssueId = event.data.linearIssueId as string | undefined;
    if (!linearIssueId) return null;

    // Update Linear issue status via GraphQL
    return {
      method: 'POST',
      url: 'https://api.linear.app/graphql',
      headers: { 'Content-Type': 'application/json' },
      body: {
        query: `mutation { issueUpdate(id: "${linearIssueId}", input: { stateId: "done" }) { success } }`,
      },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: accessToken },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Linear API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const teamId = config.teamId as string;

    // GraphQL query for issues
    const query = `query {
      issues(
        filter: { team: { id: { eq: "${teamId || ''}" } } }
        first: 50
        ${cursor ? `after: "${cursor}"` : ''}
      ) {
        nodes { id title description state { name type } priority }
        pageInfo { hasNextPage endCursor }
      }
    }`;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) throw new Error(`Linear sync failed (${res.status})`);

    const data = (await res.json()) as {
      data?: {
        issues?: {
          nodes: unknown[];
          pageInfo: { hasNextPage: boolean; endCursor?: string };
        };
      };
    };

    const issues = data.data?.issues;

    return {
      processed: issues?.nodes.length ?? 0,
      cursor: issues?.pageInfo.hasNextPage ? issues.pageInfo.endCursor : undefined,
      errors: [],
    };
  },
};

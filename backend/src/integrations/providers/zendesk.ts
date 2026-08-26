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

export const zendeskProvider: IntegrationProvider = {
  id: 'zendesk',
  name: 'Zendesk',
  requiredTier: 'clan',

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.ZENDESK_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read tickets:read tickets:write',
      state,
    });
    return `https://d3v-kanninja.zendesk.com/oauth/authorizations/new?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string): Promise<TokenSet> {
    const res = await fetch('https://d3v-kanninja.zendesk.com/oauth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.ZENDESK_CLIENT_ID,
        client_secret: env.ZENDESK_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`Zendesk token exchange failed: ${await res.text()}`);

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
    const res = await fetch('https://d3v-kanninja.zendesk.com/oauth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: env.ZENDESK_CLIENT_ID,
        client_secret: env.ZENDESK_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error('Zendesk token refresh failed');

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
  verifyWebhook(payload, headers): boolean {
    const signature = headers['x-zendesk-webhook-signature'];
    if (!signature) return false;

    const body = typeof payload === 'string' ? payload : payload.toString();
    const timestamp = headers['x-zendesk-webhook-signature-timestamp'] ?? '';
    const expected = createHmac('sha256', env.ZENDESK_CLIENT_SECRET)
      .update(timestamp + body)
      .digest('base64');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  },

  mapInbound(rawEvent): IntegrationAction | null {
    const event = rawEvent as {
      type?: string;
      ticket?: {
        id?: number;
        subject?: string;
        description?: string;
        status?: string;
        priority?: string;
      };
    };

    if (!event.ticket) return null;

    if (event.type === 'ticket.created') {
      return {
        type: 'create_card',
        data: {
          title: event.ticket.subject ?? `Ticket #${event.ticket.id}`,
          description: event.ticket.description,
          zendeskTicketId: event.ticket.id,
        },
      };
    }

    if (event.type === 'ticket.solved' || event.ticket.status === 'solved') {
      return {
        type: 'update_card',
        data: { isCompleted: true, zendeskTicketId: event.ticket.id },
      };
    }

    return null;
  },

  // --- Outbound ---
  mapOutbound(event: KanNinjaEvent, config: ProviderConfig): ExternalPayload | null {
    if (event.type !== 'card.updated' || !event.data.isCompleted) return null;

    const subdomain = config.subdomain as string;
    const ticketId = event.data.zendeskTicketId as number | undefined;
    if (!subdomain || !ticketId) return null;

    return {
      method: 'PUT',
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { ticket: { status: 'solved' } },
    };
  },

  async deliver(accessToken: string, payload: ExternalPayload): Promise<void> {
    const res = await fetch(payload.url, {
      method: payload.method,
      headers: { ...payload.headers, Authorization: `Bearer ${accessToken}` },
      body: payload.body ? JSON.stringify(payload.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Zendesk API error (${res.status}): ${await res.text()}`);
    }
  },

  async sync(
    accessToken: string,
    config: ProviderConfig,
    cursor?: string,
  ): Promise<SyncResult> {
    const subdomain = config.subdomain as string;
    if (!subdomain) return { processed: 0, errors: ['No subdomain configured'] };

    const page = cursor ? `&page=${cursor}` : '';
    const res = await fetch(
      `https://${subdomain}.zendesk.com/api/v2/tickets?sort_by=created_at&sort_order=desc&per_page=50${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) throw new Error(`Zendesk sync failed (${res.status})`);

    const data = (await res.json()) as {
      tickets: unknown[];
      next_page?: string;
    };

    return {
      processed: data.tickets.length,
      cursor: data.next_page ? String(parseInt(cursor ?? '1', 10) + 1) : undefined,
      errors: [],
    };
  },
};

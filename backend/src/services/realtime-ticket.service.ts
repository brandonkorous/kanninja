import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Short-lived tickets that authorise a single WebSocket connection.
 *
 * Browsers can't set headers on a WebSocket handshake, so the usual options
 * are a cookie or a token in the query string. Cookies would work here — the
 * session cookie is scoped to the parent domain — but a ticket is better on
 * three counts:
 *
 *  - the backend has no cookie parser, and adding one just for this is a lot
 *    of surface for one route;
 *  - it is auth-provider agnostic, so this shipped independently of the Clerk
 *    → Better Auth migration and survives the next one;
 *  - board authorisation is resolved once, when the ticket is minted over
 *    ordinary authenticated HTTP, rather than inside the socket handler.
 *
 * Tickets are stateless HMACs — nothing to store, nothing to replicate across
 * pods. They're single-use in practice only by being short-lived; that is
 * acceptable because a ticket grants exactly "subscribe to this board as this
 * profile", which the holder already had.
 */

const TICKET_TTL_MS = 60_000;
const VERSION = 'v1';

export interface TicketClaims {
  profileId: string;
  boardId: string;
  displayName: string;
  avatarUrl: string | null;
}

function secret(): string {
  // Reuses the Better Auth secret rather than adding another env var to
  // provision and rotate. Rotating it invalidates in-flight tickets, which
  // costs at most a reconnect.
  const value = env.BETTER_AUTH_SECRET || env.MCP_JWT_SECRET;
  if (!value) {
    throw new Error('BETTER_AUTH_SECRET is required to sign realtime tickets');
  }
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function issueTicket(claims: TicketClaims): { ticket: string; expiresIn: number } {
  const body = Buffer.from(
    JSON.stringify({
      ...claims,
      exp: Date.now() + TICKET_TTL_MS,
      nonce: randomBytes(8).toString('base64url'),
    }),
  ).toString('base64url');

  return {
    ticket: `${VERSION}.${body}.${sign(body)}`,
    expiresIn: Math.floor(TICKET_TTL_MS / 1000),
  };
}

export function verifyTicket(ticket: string): TicketClaims | null {
  const parts = ticket.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;

  const [, body, signature] = parts;

  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TicketClaims & {
      exp: number;
    };
    if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null;
    if (!claims.profileId || !claims.boardId) return null;

    return {
      profileId: claims.profileId,
      boardId: claims.boardId,
      displayName: claims.displayName,
      avatarUrl: claims.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}

import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from './config/env.js';

// Hosts (no scheme/port) permitted to appear in an inbound Origin header.
// An entry matches the host itself and any subdomain of it.
const ALLOWED_HOSTS = env.MCP_ALLOWED_ORIGINS.split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** True if a full Origin header value resolves to an allowlisted host. */
export function isAllowedOrigin(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false; // unparseable Origin — reject
  }
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/**
 * onRequest hook. The Origin header is browser-set and not forgeable from
 * page script, so it is a reliable cross-site signal. Requests with no
 * Origin (server-to-server, CLI clients) are allowed — the bearer token is
 * the real gate. A request carrying a disallowed Origin is rejected, which
 * blocks DNS-rebinding and cross-site abuse.
 */
export async function enforceOrigin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const origin = request.headers.origin;
  if (!origin || isAllowedOrigin(origin)) return;
  request.log.warn({ origin, url: request.url }, 'rejected disallowed Origin');
  await reply
    .code(403)
    .send({ error: 'origin_not_allowed', message: 'Request Origin is not allowed.' });
}

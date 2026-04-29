import 'dotenv/config';
import { createHash } from 'node:crypto';
import Fastify, { type FastifyRequest } from 'fastify';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authenticateRequest, AuthError } from './auth.js';
import { oauthRoutes } from './oauth.js';
import { allTools } from 'kanninja-mcp/tools';
import { registerAllTools } from 'kanninja-mcp/registry';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from '@kanninja/shared';
import type { McpContext } from 'kanninja-mcp/context';

/**
 * Memoize authenticateRequest on the request object so the rate-limit `max`
 * callback and the route handler don't each fire a network round-trip when
 * the bearer is an API key (the JWT path is local-only — cheap either way).
 */
type AuthedRequest = FastifyRequest & { __mcpCtx?: McpContext; __mcpAuthErr?: unknown };
async function getAuthContext(request: FastifyRequest): Promise<McpContext> {
  const r = request as AuthedRequest;
  if (r.__mcpCtx) return r.__mcpCtx;
  if (r.__mcpAuthErr) throw r.__mcpAuthErr;
  try {
    r.__mcpCtx = await authenticateRequest(r.headers.authorization, env.KANNINJA_API_URL);
    return r.__mcpCtx;
  } catch (err) {
    r.__mcpAuthErr = err;
    throw err;
  }
}

/** Free-tier-equivalent ceiling. Used when the bearer is missing or invalid —
 *  the request will be rejected by the auth check seconds later, but the
 *  limiter still slows brute-force probes against the unauth path. */
const UNAUTH_RATE_LIMIT = SUBSCRIPTION_TIERS.free.features.mcpRequestsPerMinute;

function rateLimitMaxFor(request: FastifyRequest): Promise<number> {
  return getAuthContext(request)
    .then((ctx) => {
      const tier = ctx.tier as SubscriptionTier;
      return SUBSCRIPTION_TIERS[tier]?.features.mcpRequestsPerMinute ?? UNAUTH_RATE_LIMIT;
    })
    .catch(() => UNAUTH_RATE_LIMIT);
}

async function start() {
  const fastify = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  // RFC 6749 §4.1.3 says /token MUST accept application/x-www-form-urlencoded.
  // Anthropic and OpenAI happen to send JSON, but other clients (Cursor, Zed,
  // anything spec-compliant) send form bodies — so register both parsers.
  await fastify.register(formbody);

  // Per-route rate limiting — global is OFF, opted in on POST /mcp via
  // route-level config. IP-based limiting would punish anyone behind a shared
  // outbound IP (e.g. all Claude.ai users), so we key on a hash of the bearer
  // token instead.
  await fastify.register(rateLimit, { global: false });

  fastify.get('/health', async () => ({ status: 'ok' }));

  await fastify.register(oauthRoutes);

  // Streamable HTTP — stateless. Every request:
  //   1. Validates its own Authorization: Bearer <ninja_live_*> header
  //   2. Builds a fresh McpContext bound to that user's key
  //   3. Spins a fresh MCP Server + transport for the duration of the request
  //
  // Stateless mode means no shared session state between requests, which makes
  // identity bleed impossible: each request runs as exactly the user whose
  // key it carries, and nothing else.
  fastify.post('/mcp', {
    config: {
      rateLimit: {
        // Tier-aware ceiling sourced from @kanninja/shared SUBSCRIPTION_TIERS.
        // Free=10, Clan=30, Pro=120, Business=600, Enterprise=6000 per minute.
        // Unauthenticated requests get the Free ceiling; they'll be rejected
        // by auth seconds later anyway, but the limiter still slows probes.
        max: (req) => rateLimitMaxFor(req),
        timeWindow: '1 minute',
        // Hash the auth header so raw tokens don't sit in the limiter's
        // memory. Unauthenticated requests fall back to IP.
        keyGenerator: (req) => {
          const auth = req.headers.authorization;
          if (!auth) return req.ip;
          return createHash('sha256').update(auth).digest('hex');
        },
      },
    },
  }, async (request, reply) => {
    let ctx;
    try {
      // getAuthContext memoizes on the request — if the rate-limit hook above
      // already authenticated, this is essentially free.
      ctx = await getAuthContext(request);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.wwwAuthenticate) reply.header('WWW-Authenticate', err.wwwAuthenticate);
        return reply.code(err.status).send({
          jsonrpc: '2.0',
          error: { code: -32001, message: err.message },
          id: null,
        });
      }
      throw err;
    }

    reply.hijack();

    const server = new Server(
      { name: 'kanninja', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );
    registerAllTools(server, allTools, ctx);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    request.raw.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  });

  // GET (SSE stream) and DELETE (session teardown) only make sense for
  // stateful sessions, which arrive in milestone 2 with OAuth.
  fastify.get('/mcp', async (_request, reply) => {
    reply.code(405).send({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  fastify.delete('/mcp', async (_request, reply) => {
    reply.code(405).send({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  await fastify.listen({ port: env.PORT, host: env.HOST });
  fastify.log.info(`MCP remote listening on http://${env.HOST}:${env.PORT}`);
}

start().catch((err) => {
  console.error('Failed to start kanNINJA MCP remote:', err);
  process.exit(1);
});

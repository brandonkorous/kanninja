import 'dotenv/config';
import { createHash } from 'node:crypto';
import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { authenticateRequest, AuthError } from './auth.js';
import { oauthRoutes } from './oauth.js';
import { allTools } from 'kanninja-mcp/tools';
import { registerAllTools } from 'kanninja-mcp/registry';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

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
        max: 60,
        timeWindow: '1 minute',
        // Hash the auth header so raw tokens don't sit in the limiter's
        // memory. Unauthenticated requests fall back to IP — they'll be
        // rejected by authenticateRequest seconds later, but the limiter
        // still slows brute-force probes.
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
      ctx = await authenticateRequest(
        request.headers.authorization,
        env.KANNINJA_API_URL,
      );
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

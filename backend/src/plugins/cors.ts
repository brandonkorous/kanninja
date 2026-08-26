import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env.js';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    // Single exact origin, not a wildcard — `credentials: true` requires it,
    // and the browser refuses to send the session cookie to `*`.
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Authorization is still needed: browsers authenticate with the Better
    // Auth cookie, but API keys (ninja_live_*) and MCP OAuth tokens arrive as
    // bearer headers on the same routes.
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
});

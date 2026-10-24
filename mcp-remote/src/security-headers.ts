import type { FastifyInstance } from 'fastify';

// One year, subdomains included; the service is HTTPS-only behind the ingress.
const HSTS = 'max-age=31536000; includeSubDomains';

/** Adds HSTS and nosniff to every response, errors included. */
export function addSecurityHeaders(fastify: FastifyInstance): void {
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('Strict-Transport-Security', HSTS);
    reply.header('X-Content-Type-Options', 'nosniff');
  });
}

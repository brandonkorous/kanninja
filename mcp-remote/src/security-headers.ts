import type { FastifyInstance } from 'fastify';

/** Adds nosniff to every response, errors included; HSTS comes from the ingress. */
export function addSecurityHeaders(fastify: FastifyInstance): void {
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
  });
}

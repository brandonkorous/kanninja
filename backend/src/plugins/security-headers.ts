import fp from 'fastify-plugin';

// HSTS comes from the ingress for every host, so only nosniff is set here.
export const securityHeadersPlugin = fp(async (fastify) => {
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
  });
});

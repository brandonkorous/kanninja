import fp from 'fastify-plugin';

// One year, subdomains included; the API is HTTPS-only behind the ingress.
export const HSTS = 'max-age=31536000; includeSubDomains';

export const securityHeadersPlugin = fp(async (fastify) => {
  fastify.addHook('onSend', async (_request, reply) => {
    reply.header('Strict-Transport-Security', HSTS);
    reply.header('X-Content-Type-Options', 'nosniff');
  });
});

import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
}

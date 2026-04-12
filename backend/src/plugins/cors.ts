import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env.js';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
});

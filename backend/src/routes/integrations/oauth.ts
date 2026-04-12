import { FastifyInstance } from 'fastify';
import * as service from '../../services/integration.service.js';
import { env } from '../../config/env.js';

export async function integrationOAuthRoutes(fastify: FastifyInstance) {
  // OAuth callback — receives code + state from provider redirect
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/api/v1/integrations/oauth/callback',
    async (request, reply) => {
      const { code, state, error } = request.query;

      if (error) {
        return reply.redirect(
          `${env.FRONTEND_URL}/integrations/callback?error=${encodeURIComponent(error)}`,
        );
      }

      if (!code || !state) {
        return reply.redirect(
          `${env.FRONTEND_URL}/integrations/callback?error=missing_params`,
        );
      }

      try {
        await service.handleCallback(code, state);
        return reply.redirect(`${env.FRONTEND_URL}/integrations/callback?success=true`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return reply.redirect(
          `${env.FRONTEND_URL}/integrations/callback?error=${encodeURIComponent(msg)}`,
        );
      }
    },
  );
}

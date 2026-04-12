import { FastifyInstance } from 'fastify';
import { verifyKeySchema } from '@kanninja/shared';
import { apiKeyService } from '../../services/api-key.service.js';

export async function verifyKeyRoutes(fastify: FastifyInstance) {
  // Public endpoint — the API key IS the auth. No Clerk middleware.
  // Called once when an MCP subprocess boots to validate its key.
  fastify.post('/api/v1/auth/verify-key', async (request) => {
    const { key } = verifyKeySchema.parse(request.body);
    const result = await apiKeyService.verifyKey(key);

    return {
      data: {
        userId: result.userId,
        displayName: result.displayName,
        email: result.email,
        tier: result.tier,
      },
    };
  });
}

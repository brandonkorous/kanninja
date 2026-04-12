import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { apiKeyService } from '../../services/api-key.service.js';
import { createApiKeySchema } from '@kanninja/shared';

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // Create a new API key — returns the full key once
  fastify.post(
    '/api/v1/auth/api-keys',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { displayName } = createApiKeySchema.parse(request.body);
      const result = await apiKeyService.createKey(request.profileId!, displayName);
      return reply.status(201).send({ data: result });
    },
  );

  // List user's keys (prefixes only, never the hash)
  fastify.get(
    '/api/v1/auth/api-keys',
    { preHandler: [requireAuth] },
    async (request) => {
      const keys = await apiKeyService.listKeys(request.profileId!);
      return { data: keys };
    },
  );

  // Revoke a single key
  fastify.delete<{ Params: { keyId: string } }>(
    '/api/v1/auth/api-keys/:keyId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      await apiKeyService.revokeKey(request.params.keyId, request.profileId!);
      return reply.status(204).send();
    },
  );

  // Revoke all keys
  fastify.delete(
    '/api/v1/auth/api-keys',
    { preHandler: [requireAuth] },
    async (request) => {
      const result = await apiKeyService.revokeAllKeys(request.profileId!);
      return { data: result };
    },
  );
}

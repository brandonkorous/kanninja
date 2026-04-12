import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import * as service from '../../services/integration.service.js';
import * as repo from '../../repositories/integration.repo.js';

export async function integrationRoutes(fastify: FastifyInstance) {
  // List available providers
  fastify.get(
    '/api/v1/integrations/providers',
    { preHandler: [requireAuth] },
    async (request) => {
      const providers = await service.listProviders(request.profileId!);
      return { data: providers };
    },
  );

  // List user's connections
  fastify.get(
    '/api/v1/integrations/connections',
    { preHandler: [requireAuth] },
    async (request) => {
      const connections = await service.listConnections(request.profileId!);
      return { data: connections };
    },
  );

  // List recent events across all user's connections
  fastify.get(
    '/api/v1/integrations/events',
    { preHandler: [requireAuth] },
    async (request) => {
      const connections = await service.listConnections(request.profileId!);
      const allEvents = [];
      for (const conn of connections) {
        const events = await repo.findEventsByConnection(conn.id, 10);
        for (const e of events) {
          allEvents.push({ ...e, providerId: conn.providerId });
        }
      }
      allEvents.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return { data: allEvents.slice(0, 20) };
    },
  );

  // Initiate OAuth connect
  fastify.post<{ Params: { provider: string }; Body: { clanId?: string } }>(
    '/api/v1/integrations/:provider/connect',
    { preHandler: [requireAuth] },
    async (request) => {
      const { provider } = request.params;
      const clanId = (request.body as { clanId?: string })?.clanId;
      const result = await service.initiateConnect(request.profileId!, provider, clanId);
      return { data: result };
    },
  );

  // Update connection config
  fastify.patch<{ Params: { id: string }; Body: { config: Record<string, unknown> } }>(
    '/api/v1/integrations/connections/:id',
    { preHandler: [requireAuth] },
    async (request) => {
      const conn = await service.updateConnectionConfig(
        request.params.id,
        request.profileId!,
        request.body.config,
      );
      return { data: conn };
    },
  );

  // Pause/resume connection
  fastify.post<{ Params: { id: string } }>(
    '/api/v1/integrations/connections/:id/pause',
    { preHandler: [requireAuth] },
    async (request) => {
      const conn = await service.pauseConnection(request.params.id, request.profileId!);
      return { data: conn };
    },
  );

  // Trigger manual sync
  fastify.post<{ Params: { id: string } }>(
    '/api/v1/integrations/connections/:id/sync',
    { preHandler: [requireAuth] },
    async (request) => {
      const result = await service.triggerSync(request.params.id, request.profileId!);
      return { data: result };
    },
  );

  // Disconnect
  fastify.delete<{ Params: { id: string } }>(
    '/api/v1/integrations/connections/:id',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      await service.disconnectProvider(request.params.id, request.profileId!);
      return reply.status(204).send();
    },
  );
}

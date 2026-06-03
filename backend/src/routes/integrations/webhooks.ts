import { FastifyInstance } from 'fastify';
import { getProvider } from '../../integrations/registry.js';
import { executeAction } from '../../integrations/action-executor.js';
import * as repo from '../../repositories/integration.repo.js';

export async function integrationWebhookRoutes(fastify: FastifyInstance) {
  fastify.post<{ Params: { provider: string } }>(
    '/api/webhooks/integrations/:provider',
    { config: { rawBody: true } },
    async (request, reply) => {
      const { provider: providerId } = request.params;

      let provider;
      try {
        provider = getProvider(providerId);
      } catch {
        return reply.status(404).send({ error: 'Unknown provider' });
      }

      // Prefer the exact bytes the sender signed (captured by fastify-raw-body
      // via config.rawBody above); fall back to a re-serialized body only if
      // unavailable.
      const rawBody =
        request.rawBody ??
        (typeof request.body === 'string' ? request.body : JSON.stringify(request.body));

      const isValid = provider.verifyWebhook(
        rawBody,
        request.headers as Record<string, string>,
      );
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid webhook signature' });
      }

      const action = provider.mapInbound(request.body);
      if (!action) {
        return reply.status(200).send({ received: true, action: 'skipped' });
      }

      // Find a connection for this provider to determine the owner
      // In a real implementation, the webhook payload would contain
      // metadata to identify the specific connection (e.g., channel ID)
      const connections = await findConnectionForWebhook(providerId);
      if (!connections) {
        fastify.log.warn({ providerId }, 'Webhook received but no active connection found');
        return reply.status(200).send({ received: true, action: 'no_connection' });
      }

      try {
        await executeAction(action, connections.profileId);
        await repo.logEvent({
          connectionId: connections.id,
          direction: 'inbound',
          eventType: action.type,
          status: 'success',
          payload: action.data,
        });
      } catch (err) {
        await repo.logEvent({
          connectionId: connections.id,
          direction: 'inbound',
          eventType: action.type,
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        await repo.incrementFailures(connections.id);
      }

      return reply.status(200).send({ received: true });
    },
  );
}

/**
 * Find an active connection for a provider from webhook metadata.
 * Phase 2: basic lookup by provider ID. Phase 3 will use provider-specific
 * metadata (GitHub installation ID, Slack team ID) to match precisely.
 */
async function findConnectionForWebhook(providerId: string) {
  const allConnections = await repo.findConnectionsByProvider(providerId);
  return allConnections.find((c) => c.status === 'active') ?? null;
}

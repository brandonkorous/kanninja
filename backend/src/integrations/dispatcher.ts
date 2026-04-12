import { getProvider } from './registry.js';
import { decrypt } from './crypto.js';
import * as repo from '../repositories/integration.repo.js';
import type { KanNinjaEvent } from './types.js';

export async function dispatchEvent(
  profileId: string,
  event: KanNinjaEvent,
): Promise<void> {
  const connections = await repo.findConnectionsByProfile(profileId);
  const active = connections.filter((c) => c.status === 'active');

  for (const conn of active) {
    const provider = getProvider(conn.providerId);
    try {
      const payload = provider.mapOutbound(event, conn.providerConfig ?? {});
      if (!payload) continue;
      if (!conn.encryptedAccessToken) continue;

      const accessToken = decrypt(conn.encryptedAccessToken);
      await provider.deliver(accessToken, payload);

      await repo.logEvent({
        connectionId: conn.id,
        direction: 'outbound',
        eventType: event.type,
        status: 'success',
      });
      await repo.resetFailures(conn.id);
    } catch (err) {
      await repo.logEvent({
        connectionId: conn.id,
        direction: 'outbound',
        eventType: event.type,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      await repo.incrementFailures(conn.id);
    }
  }
}

import { db } from '../db/index.js';
import {
  integrationProviders,
  integrationConnections,
  integrationEvents,
  integrationSyncState,
} from '../db/schema/integrations.js';
import { eq, and, isNull } from 'drizzle-orm';

// --- Providers ---

export async function findAllProviders() {
  return db.select().from(integrationProviders).where(eq(integrationProviders.enabled, true));
}

export async function findProviderById(id: string) {
  const [row] = await db
    .select()
    .from(integrationProviders)
    .where(eq(integrationProviders.id, id))
    .limit(1);
  return row ?? null;
}

// --- Connections ---

export async function findConnectionsByProfile(profileId: string) {
  return db
    .select()
    .from(integrationConnections)
    .where(eq(integrationConnections.profileId, profileId));
}

export async function findConnectionsByProvider(providerId: string) {
  return db
    .select()
    .from(integrationConnections)
    .where(eq(integrationConnections.providerId, providerId));
}

export async function findActiveConnections() {
  return db
    .select()
    .from(integrationConnections)
    .where(eq(integrationConnections.status, 'active'));
}

export async function findConnectionById(id: string) {
  const [row] = await db
    .select()
    .from(integrationConnections)
    .where(eq(integrationConnections.id, id))
    .limit(1);
  return row ?? null;
}

export async function findExistingConnection(
  profileId: string,
  providerId: string,
  clanId?: string,
) {
  const conditions = [
    eq(integrationConnections.profileId, profileId),
    eq(integrationConnections.providerId, providerId),
  ];
  if (clanId) {
    conditions.push(eq(integrationConnections.clanId, clanId));
  } else {
    conditions.push(isNull(integrationConnections.clanId));
  }

  const [row] = await db
    .select()
    .from(integrationConnections)
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function createConnection(data: {
  profileId: string;
  providerId: string;
  clanId?: string;
  encryptedAccessToken: string | null;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: Date | null;
  status?: 'active' | 'paused' | 'error' | 'revoked';
  providerConfig?: Record<string, unknown>;
}) {
  const [row] = await db
    .insert(integrationConnections)
    .values(data)
    .returning();
  return row;
}

export async function updateConnection(
  id: string,
  data: Partial<{
    status: 'active' | 'paused' | 'error' | 'revoked';
    encryptedAccessToken: string | null;
    encryptedRefreshToken: string | null;
    tokenExpiresAt: Date | null;
    providerConfig: Record<string, unknown>;
    consecutiveFailures: number;
    lastSyncedAt: Date;
    updatedAt: Date;
  }>,
) {
  const [row] = await db
    .update(integrationConnections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(integrationConnections.id, id))
    .returning();
  return row;
}

export async function deleteConnection(id: string) {
  await db.delete(integrationConnections).where(eq(integrationConnections.id, id));
}

export async function incrementFailures(id: string) {
  const conn = await findConnectionById(id);
  if (!conn) return;
  const failures = conn.consecutiveFailures + 1;
  const status = failures >= 5 ? ('error' as const) : conn.status;
  await updateConnection(id, { consecutiveFailures: failures, status });
}

export async function resetFailures(id: string) {
  await updateConnection(id, { consecutiveFailures: 0 });
}

// --- Events ---

export async function logEvent(data: {
  connectionId: string;
  direction: 'inbound' | 'outbound';
  eventType: string;
  status: 'success' | 'failed' | 'skipped';
  payload?: unknown;
  errorMessage?: string;
}) {
  const [row] = await db.insert(integrationEvents).values(data).returning();
  return row;
}

export async function findEventsByConnection(connectionId: string, limit = 50) {
  return db
    .select()
    .from(integrationEvents)
    .where(eq(integrationEvents.connectionId, connectionId))
    .limit(limit);
}

// --- Sync State ---

export async function findSyncState(connectionId: string, resourceType: string) {
  const [row] = await db
    .select()
    .from(integrationSyncState)
    .where(
      and(
        eq(integrationSyncState.connectionId, connectionId),
        eq(integrationSyncState.resourceType, resourceType),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function upsertSyncState(data: {
  connectionId: string;
  resourceType: string;
  syncCursor?: string;
  lastIncrementalAt?: Date;
  lastFullSyncAt?: Date;
  metadata?: unknown;
}) {
  const existing = await findSyncState(data.connectionId, data.resourceType);
  if (existing) {
    const [row] = await db
      .update(integrationSyncState)
      .set(data)
      .where(eq(integrationSyncState.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db.insert(integrationSyncState).values(data).returning();
  return row;
}

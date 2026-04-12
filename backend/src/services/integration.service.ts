import { env } from '../config/env.js';
import { getProvider, getAllProviders } from '../integrations/registry.js';
import { encrypt, decrypt } from '../integrations/crypto.js';
import * as repo from '../repositories/integration.repo.js';
import { AppError } from '../utils/errors.js';
import { db } from '../db/index.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { eq } from 'drizzle-orm';
import type { ProviderConfig } from '../integrations/types.js';
import { createHmac, timingSafeEqual } from 'node:crypto';

interface StatePayload {
  profileId: string;
  providerId: string;
  clanId?: string;
  exp: number;
}

function stateSecret(): string {
  return env.INTEGRATION_ENCRYPTION_KEY.slice(0, 32);
}

function signStateToken(payload: Omit<StatePayload, 'exp'>): string {
  const data: StatePayload = { ...payload, exp: Date.now() + 10 * 60 * 1000 };
  const json = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(json).digest('base64url');
  return `${json}.${sig}`;
}

function verifyStateToken(token: string): StatePayload {
  const [json, sig] = token.split('.');
  if (!json || !sig) throw AppError.validationError('Invalid OAuth state');

  const expected = createHmac('sha256', stateSecret()).update(json).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw AppError.validationError('Invalid OAuth state signature');
  }

  const payload = JSON.parse(Buffer.from(json, 'base64url').toString()) as StatePayload;
  if (payload.exp < Date.now()) {
    throw AppError.validationError('OAuth state expired');
  }
  return payload;
}

const TIER_ORDER: Record<string, number> = {
  free: 0,
  essentials: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
};

async function getUserTierRank(profileId: string): Promise<number> {
  const [sub] = await db
    .select({ tier: subscriptions.subscriptionTier })
    .from(subscriptions)
    .where(eq(subscriptions.userId, profileId))
    .limit(1);
  return TIER_ORDER[sub?.tier ?? 'free'] ?? 0;
}

export async function listProviders(profileId: string) {
  const userRank = await getUserTierRank(profileId);
  const all = await repo.findAllProviders();
  const registered = getAllProviders();
  const registeredIds = new Set(registered.map((p) => p.id));

  return all
    .filter((p) => registeredIds.has(p.id))
    .map((p) => ({
      ...p,
      available: userRank >= (TIER_ORDER[p.requiredTier] ?? 0),
    }));
}

export async function listConnections(profileId: string) {
  return repo.findConnectionsByProfile(profileId);
}

export async function getConnection(id: string, profileId: string) {
  const conn = await repo.findConnectionById(id);
  if (!conn || conn.profileId !== profileId) throw AppError.notFound('Connection');
  return conn;
}

export async function initiateConnect(
  profileId: string,
  providerId: string,
  clanId?: string,
) {
  const provider = getProvider(providerId);
  const userRank = await getUserTierRank(profileId);
  const requiredRank = TIER_ORDER[provider.requiredTier] ?? 0;

  if (userRank < requiredRank) {
    throw AppError.tierInsufficient(provider.requiredTier);
  }

  const existing = await repo.findExistingConnection(profileId, providerId, clanId);
  if (existing && existing.status === 'active') {
    throw AppError.conflict('Integration already connected');
  }

  const state = signStateToken({ profileId, providerId, clanId });
  const redirectUri = `${env.FRONTEND_URL}/integrations/callback`;
  const authUrl = provider.getAuthUrl(state, redirectUri);

  return { authUrl };
}

export async function handleCallback(code: string, state: string) {
  const { profileId, providerId, clanId } = verifyStateToken(state);
  const provider = getProvider(providerId);
  const redirectUri = `${env.FRONTEND_URL}/integrations/callback`;
  const tokens = await provider.exchangeCode(code, redirectUri);

  const existing = await repo.findExistingConnection(profileId, providerId, clanId);
  if (existing) {
    return repo.updateConnection(existing.id, {
      status: 'active',
      encryptedAccessToken: encrypt(tokens.accessToken),
      encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt,
      consecutiveFailures: 0,
    });
  }

  return repo.createConnection({
    profileId,
    providerId,
    clanId,
    encryptedAccessToken: encrypt(tokens.accessToken),
    encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
    tokenExpiresAt: tokens.expiresAt,
  });
}

export async function updateConnectionConfig(
  connectionId: string,
  profileId: string,
  config: ProviderConfig,
) {
  const conn = await getConnection(connectionId, profileId);
  return repo.updateConnection(conn.id, { providerConfig: config });
}

export async function pauseConnection(connectionId: string, profileId: string) {
  const conn = await getConnection(connectionId, profileId);
  const newStatus = conn.status === 'paused' ? 'active' : 'paused';
  return repo.updateConnection(conn.id, { status: newStatus as 'active' | 'paused' });
}

export async function disconnectProvider(connectionId: string, profileId: string) {
  const conn = await getConnection(connectionId, profileId);
  const provider = getProvider(conn.providerId);

  if (conn.encryptedAccessToken && provider.revokeTokens) {
    try {
      await provider.revokeTokens(decrypt(conn.encryptedAccessToken));
    } catch {
      // Best-effort revocation — don't block disconnect
    }
  }

  await repo.deleteConnection(conn.id);
}

export async function triggerSync(connectionId: string, profileId: string) {
  const conn = await getConnection(connectionId, profileId);
  if (conn.status !== 'active') {
    throw AppError.validationError('Connection is not active');
  }
  if (!conn.encryptedAccessToken) {
    throw AppError.validationError('No access token available');
  }

  const provider = getProvider(conn.providerId);
  const accessToken = decrypt(conn.encryptedAccessToken);
  const syncState = await repo.findSyncState(conn.id, 'default');
  const result = await provider.sync(
    accessToken,
    conn.providerConfig ?? {},
    syncState?.syncCursor ?? undefined,
  );

  await repo.upsertSyncState({
    connectionId: conn.id,
    resourceType: 'default',
    syncCursor: result.cursor,
    lastIncrementalAt: new Date(),
  });

  await repo.updateConnection(conn.id, { lastSyncedAt: new Date() });
  await repo.resetFailures(conn.id);

  return result;
}

export async function refreshConnectionToken(connectionId: string) {
  const conn = await repo.findConnectionById(connectionId);
  if (!conn || !conn.encryptedRefreshToken) return null;

  const provider = getProvider(conn.providerId);
  const refreshToken = decrypt(conn.encryptedRefreshToken);

  try {
    const tokens = await provider.refreshTokens(refreshToken);
    await repo.updateConnection(conn.id, {
      encryptedAccessToken: encrypt(tokens.accessToken),
      encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt,
    });
    return tokens;
  } catch {
    await repo.updateConnection(conn.id, { status: 'error' });
    return null;
  }
}

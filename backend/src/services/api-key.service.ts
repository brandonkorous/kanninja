import { randomBytes, createHash } from 'node:crypto';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema/api-keys.js';
import { profiles } from '../db/schema/profiles.js';
import { subscriptions } from '../db/schema/subscriptions.js';
import { AppError } from '../utils/errors.js';

const KEY_PREFIX = 'ninja_live_';

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateRawKey(): { fullKey: string; prefix: string } {
  const secret = randomBytes(32).toString('hex');
  const fullKey = `${KEY_PREFIX}${secret}`;
  const prefix = fullKey.slice(0, 16);
  return { fullKey, prefix };
}

export const apiKeyService = {
  async createKey(userId: string, displayName: string) {
    const { fullKey, prefix } = generateRawKey();
    const keyHash = hashKey(fullKey);

    const [row] = await db
      .insert(apiKeys)
      .values({ userId, displayName, keyPrefix: prefix, keyHash })
      .returning({ id: apiKeys.id, displayName: apiKeys.displayName, keyPrefix: apiKeys.keyPrefix });

    return { id: row.id, displayName: row.displayName, prefix: row.keyPrefix, fullKey };
  },

  async verifyKey(rawKey: string) {
    if (!rawKey.startsWith(KEY_PREFIX)) {
      throw AppError.unauthorized('Invalid API key format');
    }

    const keyHash = hashKey(rawKey);

    const [row] = await db
      .select({
        keyId: apiKeys.id,
        userId: apiKeys.userId,
        revokedAt: apiKeys.revokedAt,
        expiresAt: apiKeys.expiresAt,
        displayName: profiles.displayName,
        email: profiles.email,
        tier: subscriptions.subscriptionTier,
      })
      .from(apiKeys)
      .innerJoin(profiles, eq(profiles.id, apiKeys.userId))
      .leftJoin(subscriptions, eq(subscriptions.userId, apiKeys.userId))
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!row) throw AppError.unauthorized('Invalid API key');
    if (row.revokedAt) throw AppError.unauthorized('API key has been revoked');
    if (row.expiresAt && row.expiresAt < new Date()) {
      throw AppError.unauthorized('API key has expired');
    }

    // Update lastUsedAt in the background — don't block the response
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyHash, keyHash))
      .execute()
      .catch(() => {});

    return {
      keyId: row.keyId,
      userId: row.userId,
      displayName: row.displayName,
      email: row.email,
      tier: (row.tier ?? 'free') as string,
    };
  },

  async listKeys(userId: string) {
    return db
      .select({
        id: apiKeys.id,
        displayName: apiKeys.displayName,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);
  },

  async revokeKey(keyId: string, userId: string) {
    const [row] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning({ id: apiKeys.id });

    if (!row) throw AppError.notFound('API key');
    return row;
  },

  async revokeAllKeys(userId: string) {
    const result = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id });

    return { revoked: result.length };
  },
};

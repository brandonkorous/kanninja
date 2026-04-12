import { z } from 'zod';
import { SubscriptionTier } from '../enums.js';

const tierValues = Object.values(SubscriptionTier) as [string, ...string[]];

export const createApiKeySchema = z.object({
  displayName: z.string().min(1).max(100),
});

export const apiKeySchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(z.string()),
  lastUsedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const verifyKeySchema = z.object({
  key: z.string().min(1),
});

export const verifyKeyResponseSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().nullable(),
  email: z.string().email(),
  tier: z.enum(tierValues),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type VerifyKeyInput = z.infer<typeof verifyKeySchema>;
export type VerifyKeyResponse = z.infer<typeof verifyKeyResponseSchema>;

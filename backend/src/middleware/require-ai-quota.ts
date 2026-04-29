import { FastifyRequest, FastifyReply } from 'fastify';
import { assertWithinAIQuota } from '../services/ai-quota.service.js';
import { AppError } from '../utils/errors.js';

/**
 * preHandler that rejects an AI request when the caller has hit their tier's
 * quota. Designed to replace the old `requireSubscription(PRO)` gate on AI
 * routes — under the new pricing, Free and Clan get small AI allowances too,
 * and the cap (not the tier) is what gates access.
 */
export async function requireAIQuota(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const userId = request.profileId;
  if (!userId) throw AppError.unauthorized();
  await assertWithinAIQuota(userId);
}

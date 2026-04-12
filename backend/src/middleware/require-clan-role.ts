import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { clanMembers } from '../db/schema/clans.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import type { ClanRole } from '@kanninja/shared';

const ROLE_HIERARCHY: Record<string, number> = {
  reader: 1,
  member: 2,
  admin: 3,
};

export function requireClanRole(minRole: ClanRole) {
  return async function (
    request: FastifyRequest<{ Params: { clanId: string } }>,
    _reply: FastifyReply,
  ) {
    const { clanId } = request.params;
    const userId = request.profileId;

    if (!userId) throw AppError.unauthorized();

    const [member] = await db
      .select({ role: clanMembers.role })
      .from(clanMembers)
      .where(and(eq(clanMembers.clanId, clanId), eq(clanMembers.userId, userId)))
      .limit(1);

    if (!member) {
      throw AppError.forbidden('You are not a member of this clan');
    }

    const userLevel = ROLE_HIERARCHY[member.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      throw AppError.forbidden(`This action requires ${minRole} access or higher`);
    }
  };
}

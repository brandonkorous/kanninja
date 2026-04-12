import { FastifyInstance } from 'fastify';
import { clanInvitationRoutes } from './clans.js';

// Clans are the only thing users get invited to. Board invitations
// were removed when access shifted to the clan-centric model — boards
// are granted to clans via the `board_clans` join table, not to users
// directly. This file stays as a stable registration point in case
// future invitation kinds appear.
export async function invitationRoutes(fastify: FastifyInstance) {
  await fastify.register(clanInvitationRoutes);
}

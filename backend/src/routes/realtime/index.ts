import { FastifyInstance } from 'fastify';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { realtimeHub } from '../../services/realtime-hub.js';
import { issueTicket, verifyTicket } from '../../services/realtime-ticket.service.js';

/**
 * Realtime over WebSocket, replacing Supabase Realtime broadcast + presence.
 *
 * Two endpoints:
 *   POST /api/v1/boards/:boardId/realtime-ticket  — normal authenticated HTTP,
 *        board role checked here, once.
 *   GET  /api/v1/realtime?ticket=…                — the socket. Carries no
 *        credentials of its own; the ticket is the authorisation.
 *
 * Caddy upgrades WebSockets through `reverse_proxy` transparently, so this
 * needs no change to the shared ingress config.
 */
export async function realtimeRoutes(fastify: FastifyInstance) {
  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/realtime-ticket',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const [profile] = await db
        .select({
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          email: profiles.email,
        })
        .from(profiles)
        .where(eq(profiles.id, request.profileId!))
        .limit(1);

      const { ticket, expiresIn } = issueTicket({
        profileId: request.profileId!,
        boardId: request.params.boardId,
        // Presence shows a name to other people in the dojo, so fall back to
        // the email local-part rather than leaking a full address.
        displayName: profile?.displayName?.trim() || profile?.email?.split('@')[0] || 'Anonymous',
        avatarUrl: profile?.avatarUrl ?? null,
      });

      return { data: { ticket, expiresIn } };
    },
  );

  fastify.get<{ Querystring: { ticket?: string } }>(
    '/api/v1/realtime',
    { websocket: true },
    (socket, request) => {
      const claims = request.query.ticket ? verifyTicket(request.query.ticket) : null;

      if (!claims) {
        // 1008 = policy violation.
        socket.close(1008, 'Invalid or expired ticket');
        return;
      }

      const { boardId } = claims;

      realtimeHub.join(boardId, socket, {
        userId: claims.profileId,
        displayName: claims.displayName,
        avatarUrl: claims.avatarUrl,
      });

      socket.on('close', () => realtimeHub.leave(boardId, socket));
      socket.on('error', () => realtimeHub.leave(boardId, socket));

      // The client sends periodic pings; echo them so it can tell a live
      // connection from one silently dropped by an intermediary.
      socket.on('message', (raw: Buffer) => {
        if (raw.toString() === 'ping') socket.send('pong');
      });
    },
  );
}

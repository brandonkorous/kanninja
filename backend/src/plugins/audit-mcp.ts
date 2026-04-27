import fp from 'fastify-plugin';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { auditLogService } from '../services/audit-log.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const METHOD_TO_ACTION: Record<string, 'create' | 'update' | 'delete'> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

/**
 * Walk path segments back-to-front, return the last non-UUID one as the
 * "table" plus the UUID that followed it (if any) as the recordId.
 * Examples:
 *   /api/v1/boards                          → { tableName: 'boards', recordId: null }
 *   /api/v1/boards/abc-…                    → { tableName: 'boards', recordId: 'abc-…' }
 *   /api/v1/boards/abc-…/cards/def-…        → { tableName: 'cards',  recordId: 'def-…' }
 *   /api/v1/boards/abc-…/cards/def-…/labels → { tableName: 'labels', recordId: null }
 */
function deriveTarget(path: string): { tableName: string | null; recordId: string | null } {
  const stripped = path.replace(/^\/+/, '').split('?')[0];
  const segments = stripped.split('/').filter(Boolean);
  // Drop a leading 'api/v1' or 'api/vN' prefix.
  const start = segments[0] === 'api' ? (segments[1]?.startsWith('v') ? 2 : 1) : 0;
  const tail = segments.slice(start);
  if (tail.length === 0) return { tableName: null, recordId: null };

  const last = tail[tail.length - 1];
  if (UUID_RE.test(last)) {
    return { tableName: tail[tail.length - 2] ?? null, recordId: last };
  }
  return { tableName: last, recordId: null };
}

/**
 * Audit MCP-originated mutations. Runs onResponse, after the user's mutation
 * has succeeded — fire-and-forget so the audit insert never blocks the
 * response. Only authenticated MCP requests with 2xx mutations are recorded:
 * read-only GETs, anonymous traffic, and Clerk/api-key origins are skipped.
 *
 * Read-side surfacing: the existing Business+ /api/v1/audit-logs endpoint
 * picks these up automatically via the metadata.origin field.
 */
export const auditMcpPlugin = fp(async (fastify) => {
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.mcpClientId || !request.profileId) return;

    const action = METHOD_TO_ACTION[request.method];
    if (!action) return;

    const status = reply.statusCode;
    if (status < 200 || status >= 300) return;

    const { tableName, recordId } = deriveTarget(request.url);

    void auditLogService.record({
      userId: request.profileId,
      actionType: action,
      tableName,
      recordId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
      metadata: {
        origin: 'mcp',
        client_id: request.mcpClientId,
        client_name: request.mcpClientName ?? null,
        scopes: request.mcpScopes ?? [],
        method: request.method,
        path: request.url,
        status,
      },
    });
  });
});

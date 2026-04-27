import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/activities.js';

type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'invite'
  | 'join'
  | 'export'
  | 'import'
  | 'settings_change'
  | 'permission_change';

export const auditLogService = {
  /**
   * Append-only audit record. Errors are swallowed and logged because audit
   * failures must NEVER block a successful user request — the alternative
   * (rolling back the user's mutation because the audit insert tripped) is
   * worse than a missing log row.
   */
  async record(opts: {
    userId: string;
    actionType: AuditActionType;
    tableName?: string | null;
    recordId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: opts.userId,
        actionType: opts.actionType,
        tableName: opts.tableName ?? null,
        recordId: opts.recordId ?? null,
        metadata: opts.metadata ?? null,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      });
    } catch (err) {
      // Best-effort: log to stderr but never throw. The user's mutation has
      // already succeeded by the time this runs (onResponse hook).
      console.error('[audit] Failed to record audit entry:', err);
    }
  },
};

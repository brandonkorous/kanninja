import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { requireSubscription } from '../../middleware/require-subscription.js';
import { db } from '../../db/index.js';
import { lists } from '../../db/schema/lists.js';
import { cards } from '../../db/schema/cards.js';
import { auditLogs } from '../../db/schema/activities.js';
import { projectExpenses } from '../../db/schema/analytics.js';
import { eq, and, desc } from 'drizzle-orm';
import { SubscriptionTier } from '@kanninja/shared';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Burndown chart data
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/analytics/burndown',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const boardCards = await db
        .select({
          id: cards.id,
          createdAt: cards.createdAt,
          completedAt: cards.completedAt,
          isCompleted: cards.isCompleted,
        })
        .from(cards)
        .innerJoin(lists, eq(cards.listId, lists.id))
        .where(eq(lists.boardId, request.params.boardId));

      // Build daily snapshots over the last 30 days
      const days = 30;
      const today = new Date();
      const data: { date: string; remaining: number; completed: number }[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);

        const completed = boardCards.filter(
          (c) => c.completedAt && c.completedAt <= date,
        ).length;
        const total = boardCards.filter((c) => c.createdAt <= date).length;

        data.push({
          date: date.toISOString().split('T')[0],
          remaining: total - completed,
          completed,
        });
      }

      return { data };
    },
  );

  // Velocity (cards completed per week)
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/analytics/velocity',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const completed = await db
        .select({
          completedAt: cards.completedAt,
        })
        .from(cards)
        .innerJoin(lists, eq(cards.listId, lists.id))
        .where(and(eq(lists.boardId, request.params.boardId), eq(cards.isCompleted, true)));

      // Group by ISO week
      const weeks = new Map<string, number>();
      for (const c of completed) {
        if (!c.completedAt) continue;
        const d = new Date(c.completedAt);
        const year = d.getUTCFullYear();
        const week = Math.ceil(((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000 + 1) / 7);
        const key = `${year}-W${String(week).padStart(2, '0')}`;
        weeks.set(key, (weeks.get(key) ?? 0) + 1);
      }

      const data = Array.from(weeks.entries())
        .sort()
        .slice(-12)
        .map(([week, count]) => ({ week, count }));

      return { data };
    },
  );

  // Cycle time (avg days from creation to completion)
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/analytics/cycle-time',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const completed = await db
        .select({
          createdAt: cards.createdAt,
          completedAt: cards.completedAt,
          priority: cards.priority,
        })
        .from(cards)
        .innerJoin(lists, eq(cards.listId, lists.id))
        .where(and(eq(lists.boardId, request.params.boardId), eq(cards.isCompleted, true)));

      const cycles = completed
        .filter((c) => c.completedAt)
        .map((c) => ({
          days: Math.floor((c.completedAt!.getTime() - c.createdAt.getTime()) / 86400000),
          priority: c.priority,
        }));

      const avg =
        cycles.length === 0
          ? 0
          : cycles.reduce((sum, c) => sum + c.days, 0) / cycles.length;

      // Group by priority
      const byPriority: Record<string, number[]> = {};
      for (const c of cycles) {
        if (!byPriority[c.priority]) byPriority[c.priority] = [];
        byPriority[c.priority].push(c.days);
      }

      const priorityAverages = Object.entries(byPriority).map(([priority, days]) => ({
        priority,
        avg: days.reduce((s, d) => s + d, 0) / days.length,
      }));

      return { data: { average: avg, total: cycles.length, byPriority: priorityAverages } };
    },
  );

  // Financial summary
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/analytics/financial',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const expenses = await db
        .select()
        .from(projectExpenses)
        .where(eq(projectExpenses.boardId, request.params.boardId));

      const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const byCategory: Record<string, number> = {};
      for (const e of expenses) {
        byCategory[e.category ?? 'uncategorized'] =
          (byCategory[e.category ?? 'uncategorized'] ?? 0) + Number(e.amount);
      }

      return { data: { totalSpent, expenses, byCategory } };
    },
  );

  // Audit log query. Gated to the paid tier — it was nominally "Business+"
  // before, but AUDIT_ENABLED_TIERS was never consulted anywhere, so every
  // signed-in user could read it regardless of plan.
  fastify.get(
    '/api/v1/audit-logs',
    { preHandler: [requireAuth, requireSubscription(SubscriptionTier.CLAN)] },
    async (request) => {
      const data = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, request.profileId!))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
      return { data };
    },
  );
}

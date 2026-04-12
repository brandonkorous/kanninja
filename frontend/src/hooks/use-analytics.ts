'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './use-api';

export function useBurndown(boardId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'burndown', boardId],
    queryFn: () =>
      api
        .get<{ data: Array<{ date: string; remaining: number; completed: number }> }>(
          `/api/v1/boards/${boardId}/analytics/burndown`,
        )
        .then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useVelocity(boardId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'velocity', boardId],
    queryFn: () =>
      api
        .get<{ data: Array<{ week: string; count: number }> }>(
          `/api/v1/boards/${boardId}/analytics/velocity`,
        )
        .then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useCycleTime(boardId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['analytics', 'cycle-time', boardId],
    queryFn: () =>
      api
        .get<{
          data: {
            average: number;
            total: number;
            byPriority: Array<{ priority: string; avg: number }>;
          };
        }>(`/api/v1/boards/${boardId}/analytics/cycle-time`)
        .then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useAuditLogs() {
  const api = useApi();
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () =>
      api
        .get<{
          data: Array<{
            id: string;
            actionType: string;
            tableName: string | null;
            createdAt: string;
            metadata: Record<string, unknown> | null;
          }>;
        }>('/api/v1/audit-logs')
        .then((r) => r.data),
  });
}

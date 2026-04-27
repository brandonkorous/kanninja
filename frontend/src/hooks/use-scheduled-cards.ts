'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { UpdateCardInput } from '@kanninja/shared';

/**
 * Cards returned by /boards/:boardId/cards/scheduled and the clan
 * variant. Denormalized with list + board titles so calendar /
 * timeline / list views can render cells without secondary fetches.
 * `labelIds` is a flat array — colors are looked up against the
 * already-cached useLabels query rather than denormalized into the
 * card payload (labels can change often, names rarely).
 */
export interface ScheduledCard {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  assigneeId: string | null;
  createdBy: string;
  startDate: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  estimatedHours: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  listId: string;
  listTitle: string;
  boardId: string;
  boardTitle: string;
  /** Curated-palette slug, or null. Frontend `dojoColorClass` falls
   *  back to a hash-of-id when null so clan views always render a
   *  stable left stripe. */
  boardColor: string | null;
  labelIds: string[];
}

export interface ScheduledCardsResponse {
  scheduled: ScheduledCard[];
  unscheduled: ScheduledCard[];
}

interface RangeOptions {
  /** ISO datetime — inclusive lower bound for the span-overlap filter. */
  from?: string;
  /** ISO datetime — inclusive upper bound for the span-overlap filter. */
  to?: string;
  /** When true, the response also includes cards with no dates set. */
  unscheduled?: boolean;
}

function buildQuery(opts: RangeOptions): string {
  const params = new URLSearchParams();
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.unscheduled) params.set('unscheduled', 'true');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useBoardScheduledCards(boardId: string, opts: RangeOptions = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ['scheduled-cards', 'board', boardId, opts],
    queryFn: () =>
      api
        .get<{ data: ScheduledCardsResponse }>(
          `/api/v1/boards/${boardId}/cards/scheduled${buildQuery(opts)}`,
        )
        .then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useClanScheduledCards(clanId: string, opts: RangeOptions = {}) {
  const api = useApi();
  return useQuery({
    queryKey: ['scheduled-cards', 'clan', clanId, opts],
    queryFn: () =>
      api
        .get<{ data: ScheduledCardsResponse }>(
          `/api/v1/clans/${clanId}/cards/scheduled${buildQuery(opts)}`,
        )
        .then((r) => r.data),
    enabled: !!clanId,
  });
}

/**
 * Calendar/timeline reschedule mutation. Wraps the existing card
 * PATCH with invalidation across both the scheduled-cards cache
 * (used by views) and the board cache (used by kanban). The single
 * PATCH atomically updates startDate + dueDate so dragging a
 * timeline bar preserves the span without two server round-trips.
 *
 * boardId travels with each mutation rather than the hook so clan
 * views — which span many boards — can use one hook instance and
 * route each reschedule to the source card's dojo.
 */
export function useRescheduleCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      cardId,
      boardId,
      ...input
    }: Pick<UpdateCardInput, 'startDate' | 'dueDate'> & {
      cardId: string;
      boardId: string;
    }) => api.patch(`/api/v1/boards/${boardId}/cards/${cardId}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
      queryClient.invalidateQueries({ queryKey: ['boards', variables.boardId] });
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

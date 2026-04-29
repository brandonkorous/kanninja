'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

/**
 * Standard wrapper for any mutation that hits an /api/v1/ai/* route.
 *
 * Centralizes:
 * - Error toast (AI mutations are silent on success — the result IS the feedback)
 * - Invalidation of the AI quota counter so the indicator in Settings updates
 *   immediately after every successful run, instead of going stale until the
 *   next page load.
 *
 * New AI hooks should use this instead of plain `useMutation` — that way the
 * quota indicator stays accurate without each hook needing to remember.
 */
export function useAIMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
): UseMutationResult<TData, Error, TVariables> {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', 'ai-usage'] });
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

'use client';

import { useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface SuggestStartDateInput {
  title: string;
  description?: string;
  /** ISO datetime — required, the card must already have a due date. */
  dueDate: string;
  estimatedHours?: number;
}

interface SuggestStartDateResult {
  suggested_start_date: string;
  working_days_needed: number;
  buffer_days: number;
  reasoning: string;
}

/**
 * AI smart-start-date suggestion. Pro-gated on the backend — viewers
 * with a free tier will get a 402-style error which we surface via
 * the toast. The naive answer (dueDate - estimatedHours) can be done
 * inline by the caller for free; this hook is only worth it for the
 * calendar-aware version that respects the user's bookings.
 */
export function useSuggestStartDate() {
  const api = useApi();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: SuggestStartDateInput) =>
      api
        .post<{ data: SuggestStartDateResult }>('/api/v1/ai/smart-start-date', input)
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

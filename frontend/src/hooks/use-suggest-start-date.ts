'use client';

import { useApi } from './use-api';
import { useAIMutation } from './use-ai-mutation';

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
 * AI smart-start-date suggestion. AI-quota-gated on the backend — users
 * at their cap will get a 402-style error which we surface via the toast.
 * The naive answer (dueDate - estimatedHours) can be done inline by the
 * caller for free; this hook is only worth it for the calendar-aware
 * version that respects the user's bookings.
 */
export function useSuggestStartDate() {
  const api = useApi();
  return useAIMutation((input: SuggestStartDateInput) =>
    api
      .post<{ data: SuggestStartDateResult }>('/api/v1/ai/smart-start-date', input)
      .then((r) => r.data),
  );
}

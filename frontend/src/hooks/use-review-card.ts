'use client';

import { useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

export interface CardReviewInput {
    title: string;
    description: string | null;
    priority: string;
    estimatedHours: number | null;
}

export interface CardReviewSuggestions {
    description?: { proposed: string; reasoning: string };
    priority?: { proposed: 'low' | 'medium' | 'high' | 'urgent'; reasoning: string };
    estimatedHours?: { proposed: number; reasoning: string };
}

interface CardReviewResult {
    suggestions: CardReviewSuggestions;
}

/**
 * Holistic card review — sends the current Details state to the AI and
 * gets back a sparse set of proposed changes. Suggestions are sparse
 * by design: the prompt instructs the model to stay silent on fields
 * that are already fine. Pro-gated on the backend.
 */
export function useReviewCard() {
    const api = useApi();
    const toast = useToast();

    return useMutation({
        mutationFn: (input: CardReviewInput) =>
            api
                .post<{ data: CardReviewResult }>('/api/v1/ai/review-card', input)
                .then((r) => r.data),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

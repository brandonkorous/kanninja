'use client';

import { useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface GenerateChecklistInput {
    title: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
}

interface GenerateChecklistResult {
    steps: string[];
}

/**
 * Inline assist on the Checklist tab — only offered when the list is
 * empty. Pro-gated on the backend; free-tier users get a 402-style
 * error surfaced via toast. The caller is responsible for sequentially
 * inserting the returned steps so orderIndex stays correct.
 */
export function useGenerateChecklist() {
    const api = useApi();
    const toast = useToast();

    return useMutation({
        mutationFn: (input: GenerateChecklistInput) =>
            api
                .post<{ data: GenerateChecklistResult }>('/api/v1/ai/generate-checklist', input)
                .then((r) => r.data),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

'use client';

import { useApi } from './use-api';
import { useAIMutation } from './use-ai-mutation';

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
 * empty. AI-quota-gated on the backend; users at their cap get a
 * 402-style error surfaced via toast. The caller is responsible for
 * sequentially inserting the returned steps so orderIndex stays correct.
 */
export function useGenerateChecklist() {
    const api = useApi();
    return useAIMutation((input: GenerateChecklistInput) =>
        api
            .post<{ data: GenerateChecklistResult }>('/api/v1/ai/generate-checklist', input)
            .then((r) => r.data),
    );
}

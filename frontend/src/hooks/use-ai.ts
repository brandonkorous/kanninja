'use client';

import { useApi } from './use-api';
import { useAIMutation } from './use-ai-mutation';

// AI mutations stay silent on success — the result lands in the workspace
// panel which IS the feedback. Toasting "done" on top of visible output
// reads as shouting. Errors toast because the workspace can't show an
// empty result any other way.
//
// All hooks below use useAIMutation, which wraps useMutation with the
// standard error-toast + AI-quota-invalidation behavior.

export function useParseTask() {
  const api = useApi();
  return useAIMutation((text: string) =>
    api
      .post<{
        data: {
          title: string;
          description?: string;
          priority?: string;
          due_date?: string;
          estimated_hours?: number;
          tags?: string[];
          subtasks?: string[];
        };
      }>('/api/v1/ai/parse-task', { text })
      .then((r) => r.data),
  );
}

export function useAISuggestions() {
  const api = useApi();
  return useAIMutation((input: { title: string; type: 'subtasks' | 'priority' | 'optimization' }) =>
    api.post<{ data: unknown }>('/api/v1/ai/suggestions', input).then((r) => r.data),
  );
}

// Pass 1 of the template flow: project description → lists + board title.
export function useGenerateTemplateLists() {
  const api = useApi();
  return useAIMutation((request: string) =>
    api
      .post<{
        data: { board_title: string; board_description: string; lists: string[] };
      }>('/api/v1/ai/generate-template/lists', { request })
      .then((r) => r.data),
  );
}

// Pass 2: with the board's lists pinned, generate the starter cards.
export function useGenerateTemplateCards() {
  const api = useApi();
  return useAIMutation((input: { request: string; boardTitle: string; lists: string[] }) =>
    api
      .post<{
        data: {
          cards: Array<{ title: string; description?: string; priority?: string }>;
        };
      }>('/api/v1/ai/generate-template/cards', input)
      .then((r) => r.data),
  );
}

// Pass 3 (per card): focused checklist generation. Reused by the templates
// flow and the inline assist on the card-detail Checklist tab.
export function useGenerateChecklist() {
  const api = useApi();
  return useAIMutation((input: {
    title: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
  }) =>
    api
      .post<{ data: { steps: string[] } }>('/api/v1/ai/generate-checklist', input)
      .then((r) => r.data),
  );
}

export function useDecomposeGoal() {
  const api = useApi();
  return useAIMutation((input: { goal: string; timeframe?: string }) =>
    api
      .post<{
        data: {
          tasks: Array<{
            title: string;
            description: string;
            priority: string;
            estimated_hours: number;
          }>;
        };
      }>('/api/v1/ai/decompose-goal', input)
      .then((r) => r.data),
  );
}

export function useAIBriefing() {
  const api = useApi();
  return useAIMutation((input: { type: 'daily' | 'weekly'; boardId?: string }) =>
    api
      .post<{
        data: {
          briefing: string;
          highlights: string[];
          recommendations: string[];
          stats: { total: number; completed: number; overdue: number };
        };
      }>('/api/v1/ai/briefing', input)
      .then((r) => r.data),
  );
}

export function useAnalyzeMeeting() {
  const api = useApi();
  return useAIMutation((input: { transcript: string; boardId?: string }) =>
    api
      .post<{
        data: {
          summary: string;
          action_items: Array<{ title: string; priority: string }>;
          decisions: string[];
        };
      }>('/api/v1/ai/analyze-meeting', input)
      .then((r) => r.data),
  );
}

export function useAnalyzeRisks() {
  const api = useApi();
  return useAIMutation((boardId: string) =>
    api
      .post<{
        data: {
          risks: Array<{ severity: 'low' | 'medium' | 'high'; description: string; mitigation: string }>;
        };
      }>('/api/v1/ai/risk-analysis', { boardId })
      .then((r) => r.data),
  );
}

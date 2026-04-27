'use client';

import { useMutation } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

// AI mutations stay silent on success — the result lands in the workspace
// panel which IS the feedback. Toasting "done" on top of visible output
// reads as shouting. Errors toast because the workspace can't show an
// empty result any other way.

export function useParseTask() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (text: string) =>
      api
        .post<{ data: { title: string; description?: string; priority?: string; due_date?: string; subtasks?: string[] } }>(
          '/api/v1/ai/parse-task',
          { text },
        )
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useAISuggestions() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { title: string; type: 'subtasks' | 'priority' | 'optimization' }) =>
      api.post<{ data: unknown }>('/api/v1/ai/suggestions', input).then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

// Pass 1 of the template flow: project description → lists + board title.
export function useGenerateTemplateLists() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (request: string) =>
      api
        .post<{
          data: { board_title: string; board_description: string; lists: string[] };
        }>('/api/v1/ai/generate-template/lists', { request })
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

// Pass 2: with the board's lists pinned, generate the starter cards.
export function useGenerateTemplateCards() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { request: string; boardTitle: string; lists: string[] }) =>
      api
        .post<{
          data: {
            cards: Array<{ title: string; description?: string; priority?: string }>;
          };
        }>('/api/v1/ai/generate-template/cards', input)
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

// Pass 3 (per card): focused checklist generation. Reused by the templates
// flow and the inline assist on the card-detail Checklist tab.
export function useGenerateChecklist() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      priority?: string;
      estimatedHours?: number;
    }) =>
      api
        .post<{ data: { steps: string[] } }>('/api/v1/ai/generate-checklist', input)
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useDecomposeGoal() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { goal: string; timeframe?: string }) =>
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
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useAIBriefing() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { type: 'daily' | 'weekly'; boardId?: string }) =>
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
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useAnalyzeMeeting() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: { transcript: string; boardId?: string }) =>
      api
        .post<{
          data: {
            summary: string;
            action_items: Array<{ title: string; priority: string }>;
            decisions: string[];
          };
        }>('/api/v1/ai/analyze-meeting', input)
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useAnalyzeRisks() {
  const api = useApi();
  const toast = useToast();
  return useMutation({
    mutationFn: (boardId: string) =>
      api
        .post<{
          data: {
            risks: Array<{ severity: 'low' | 'medium' | 'high'; description: string; mitigation: string }>;
          };
        }>('/api/v1/ai/risk-analysis', { boardId })
        .then((r) => r.data),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface ChecklistItem {
    id: string;
    cardId: string;
    title: string;
    completed: boolean;
    orderIndex: number;
}

export function useChecklist(boardId: string, cardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['checklist', cardId],
        queryFn: () =>
            api
                .get<{ data: ChecklistItem[] }>(`/api/v1/boards/${boardId}/cards/${cardId}/checklist`)
                .then((r) => r.data),
        enabled: !!cardId,
    });
}

export function useCreateChecklistItem(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (title: string) =>
            api.post(`/api/v1/boards/${boardId}/cards/${cardId}/checklist`, { title }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

// Toggle is silent on success — the checkbox is its own visual confirmation.
export function useUpdateChecklistItem(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: ({ itemId, ...input }: { itemId: string; title?: string; completed?: boolean }) =>
            api.patch(`/api/v1/boards/${boardId}/cards/${cardId}/checklist/${itemId}`, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useDeleteChecklistItem(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (itemId: string) =>
            api.delete(`/api/v1/boards/${boardId}/cards/${cardId}/checklist/${itemId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

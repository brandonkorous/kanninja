'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface Label {
    id: string;
    name: string;
    color: string;
    boardId: string | null;
}

export function useBoardLabels(boardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['labels', boardId],
        queryFn: () =>
            api.get<{ data: Label[] }>(`/api/v1/boards/${boardId}/labels`).then((r) => r.data),
        enabled: !!boardId,
    });
}

export function useCardLabels(boardId: string, cardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['card-labels', cardId],
        queryFn: () =>
            api
                .get<{ data: Label[] }>(`/api/v1/boards/${boardId}/cards/${cardId}/labels`)
                .then((r) => r.data),
        enabled: !!cardId,
    });
}

export function useCreateLabel() {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (input: { name: string; color: string; boardId?: string }) =>
            api.post('/api/v1/labels', input),
        onSuccess: (_d, vars) => {
            if (vars.boardId) qc.invalidateQueries({ queryKey: ['labels', vars.boardId] });
            toast.success('Label created.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

// Assign/remove are silent — the label pill moves immediately.
export function useAssignLabel(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (labelId: string) =>
            api.post(`/api/v1/boards/${boardId}/cards/${cardId}/labels`, { labelId }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['card-labels', cardId] }),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useRemoveLabel(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (labelId: string) =>
            api.delete(`/api/v1/boards/${boardId}/cards/${cardId}/labels/${labelId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['card-labels', cardId] }),
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

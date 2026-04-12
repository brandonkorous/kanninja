'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface TimeEntry {
    id: string;
    cardId: string;
    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
    description: string | null;
    isRunning: boolean;
}

export function useTimeEntries(boardId: string, cardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['time-entries', cardId],
        queryFn: () =>
            api
                .get<{ data: TimeEntry[] }>(`/api/v1/boards/${boardId}/cards/${cardId}/time-entries`)
                .then((r) => r.data),
        enabled: !!cardId,
    });
}

export function useStartTimer(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (description?: string) =>
            api.post(`/api/v1/boards/${boardId}/cards/${cardId}/time-entries/start`, { description }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['time-entries', cardId] });
            toast.success('Timer running.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useStopTimer(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: () =>
            api.post(`/api/v1/boards/${boardId}/cards/${cardId}/time-entries/stop`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['time-entries', cardId] });
            toast.success('Timer stopped.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

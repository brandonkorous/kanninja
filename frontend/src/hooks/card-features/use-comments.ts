'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface Comment {
    id: string;
    cardId: string;
    userId: string;
    content: string;
    mentions: string[];
    replyTo: string | null;
    createdAt: string;
    updatedAt: string;
    author: { displayName: string | null; avatarUrl: string | null };
}

export function useComments(boardId: string, cardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['comments', cardId],
        queryFn: () =>
            api
                .get<{ data: Comment[] }>(`/api/v1/boards/${boardId}/cards/${cardId}/comments`)
                .then((r) => r.data),
        enabled: !!cardId,
    });
}

export function useCreateComment(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (content: string) =>
            api.post(`/api/v1/boards/${boardId}/cards/${cardId}/comments`, { content }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['comments', cardId] });
            toast.success('Note posted.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useDeleteComment(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (commentId: string) =>
            api.delete(`/api/v1/boards/${boardId}/cards/${cardId}/comments/${commentId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['comments', cardId] });
            toast.success('Note deleted.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

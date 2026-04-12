'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

// The shape returned by GET /api/v1/boards/:boardId/clans — one row
// per clan attached to the board, with the clan's role on this board
// (NOT the user's role within the clan).
export interface AttachedClan {
    id: string;
    clanId: string;
    clanName: string;
    clanDescription: string | null;
    isPersonal: boolean;
    role: 'owner' | 'editor' | 'viewer';
    createdAt: string;
}

type AttachInput = { clanId: string; role?: 'owner' | 'editor' | 'viewer' };
type UpdateRoleInput = { clanId: string; role: 'owner' | 'editor' | 'viewer' };

const KEY = (boardId: string) => ['board-clans', boardId];

export function useBoardClans(boardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: KEY(boardId),
        queryFn: () =>
            api
                .get<{ data: AttachedClan[] }>(`/api/v1/boards/${boardId}/clans`)
                .then((r) => r.data),
        enabled: !!boardId,
    });
}

export function useAttachClanToBoard(boardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (input: AttachInput) =>
            api.post(`/api/v1/boards/${boardId}/clans`, input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY(boardId) });
            // Also invalidate the dashboard list — anyone in the new
            // clan can now see this board (their dashboard will refresh
            // on next query). On the same browser, the creator's view
            // doesn't change but it's cheap to invalidate.
            qc.invalidateQueries({ queryKey: ['boards'] });
            toast.success('Clan attached.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useUpdateBoardClanRole(boardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (input: UpdateRoleInput) =>
            api.patch(`/api/v1/boards/${boardId}/clans/${input.clanId}`, {
                role: input.role,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY(boardId) });
            toast.success('Role updated.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useDetachClanFromBoard(boardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (clanId: string) =>
            api.delete(`/api/v1/boards/${boardId}/clans/${clanId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEY(boardId) });
            qc.invalidateQueries({ queryKey: ['boards'] });
            toast.success('Clan removed.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

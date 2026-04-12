'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { CreateListInput, UpdateListInput } from '@kanninja/shared';

export function useCreateList(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: CreateListInput) =>
      api.post(`/api/v1/boards/${boardId}/lists`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('List added.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useUpdateList(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ listId, ...input }: UpdateListInput & { listId: string }) =>
      api.patch(`/api/v1/boards/${boardId}/lists/${listId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('Saved.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useDeleteList(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (listId: string) =>
      api.delete(`/api/v1/boards/${boardId}/lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('List deleted.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

// Reorder is silent on success — the drag is its own confirmation.
export function useReorderLists(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.post(`/api/v1/boards/${boardId}/lists/reorder`, { orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

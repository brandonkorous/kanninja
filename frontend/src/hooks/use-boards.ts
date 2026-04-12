'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { Board, CreateBoardInput, UpdateBoardInput } from '@kanninja/shared';

interface BoardWithRole extends Board {
  role: string;
  // True when the viewer is the user who originally created the board.
  // Distinct from role='owner' (which a clan attachment can also grant).
  // Used by the clan detail page to filter the "attach a dojo" picker
  // to only boards the caller actually owns.
  isCreator: boolean;
}

export interface BoardWithChildren extends Board {
  currentUserRole: string;
  // True if the viewer is the user who originally created the board.
  // Distinct from currentUserRole='owner' (which a clan-via-attachment
  // member can also be). Gates the clan-attachment management UI.
  isCreator: boolean;
  lists: Array<{
    id: string;
    boardId: string;
    title: string;
    orderIndex: string;
    createdAt: string;
    updatedAt: string;
    cards: Array<{
      id: string;
      listId: string;
      title: string;
      description: string | null;
      priority: string;
      assigneeId: string | null;
      createdBy: string;
      dueDate: string | null;
      orderIndex: string;
      isCompleted: boolean;
      completedAt: string | null;
      estimatedHours: string | null;
      progress: number;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}

export function useBoards() {
  const api = useApi();

  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<{ data: BoardWithRole[] }>('/api/v1/boards').then((r) => r.data),
  });
}

export function useBoard(boardId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['boards', boardId],
    queryFn: () =>
      api.get<{ data: BoardWithChildren }>(`/api/v1/boards/${boardId}`).then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: CreateBoardInput) =>
      api.post<{ data: Board }>('/api/v1/boards', input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Dojo opened.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useUpdateBoard(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: UpdateBoardInput) =>
      api.patch<{ data: Board }>(`/api/v1/boards/${boardId}`, input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('Saved.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useDeleteBoard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (boardId: string) => api.delete(`/api/v1/boards/${boardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Dojo sealed.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

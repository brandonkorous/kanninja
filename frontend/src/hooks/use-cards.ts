'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import type { BoardWithChildren } from './use-boards';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { CreateCardInput, UpdateCardInput, MoveCardInput } from '@kanninja/shared';

export function useCreateCard(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      api.post(`/api/v1/boards/${boardId}/cards`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      // Also drop the scheduled-cards cache so calendar / timeline /
      // list views reflect the new kata immediately. Clan views in
      // particular don't subscribe to this board's realtime channel,
      // so the broadcast wouldn't reach them otherwise.
      queryClient.invalidateQueries({ queryKey: ['scheduled-cards'] });
      toast.success('Kata added.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useUpdateCard(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ cardId, ...input }: UpdateCardInput & { cardId: string }) =>
      api.patch(`/api/v1/boards/${boardId}/cards/${cardId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('Saved.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

// Move is intentionally silent on success — the drag-and-drop is its own
// visual confirmation. Still toasts on error so a failed move surfaces.
//
// Optimistic update: we mutate the cached board *now* so the card stays put
// in the destination column instead of snapping back to the source while we
// wait for the server round-trip. dnd-kit's drop animation then runs against
// the already-updated DOM position, giving a smooth land. Rollback on error.
export function useMoveCard(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryKey = ['boards', boardId] as const;

  return useMutation({
    mutationFn: ({ cardId, ...input }: MoveCardInput & { cardId: string }) =>
      api.post(`/api/v1/boards/${boardId}/cards/${cardId}/move`, input),

    onMutate: async ({ cardId, listId: targetListId, orderIndex: newOrderIndex, position }) => {
      // Cancel in-flight refetches so they can't clobber the optimistic write.
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!previous) return { previous };

      // Locate the card in whichever list it currently lives in.
      let movedCard: BoardWithChildren['lists'][number]['cards'][number] | undefined;
      for (const list of previous.lists) {
        const found = list.cards.find((c) => c.id === cardId);
        if (found) {
          movedCard = found;
          break;
        }
      }
      if (!movedCard) return { previous };

      const updatedCard = {
        ...movedCard,
        listId: targetListId,
        // A `position` move leaves the real index to the server; keep the
        // old one locally so the card still renders, and place it by array
        // position below rather than by sort key. onSettled reconciles.
        orderIndex: newOrderIndex ?? movedCard.orderIndex,
      };

      const nextLists = previous.lists.map((list) => {
        // Remove from any list it currently lives in (also covers same-list reorder).
        const withoutMoved = list.cards.filter((c) => c.id !== cardId);

        if (list.id !== targetListId) {
          return { ...list, cards: withoutMoved };
        }

        // Symbolic moves land at a known end of the list. Explicit-index
        // moves (drag-and-drop) insert and re-sort by fractional
        // orderIndex, which is lexicographically ordered.
        if (position === 'top') {
          return { ...list, cards: [updatedCard, ...withoutMoved] };
        }
        if (position === 'bottom') {
          return { ...list, cards: [...withoutMoved, updatedCard] };
        }

        const nextCards = [...withoutMoved, updatedCard].sort((a, b) =>
          a.orderIndex < b.orderIndex ? -1 : a.orderIndex > b.orderIndex ? 1 : 0,
        );
        return { ...list, cards: nextCards };
      });

      queryClient.setQueryData<BoardWithChildren>(queryKey, { ...previous, lists: nextLists });

      return { previous };
    },

    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getToastErrorMessage(err));
    },

    // Reconcile with server truth once the mutation finishes (success or error).
    // Also harmlessly absorbs the realtime card:moved broadcast on the same key.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (cardId: string) =>
      api.delete(`/api/v1/boards/${boardId}/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
      toast.success('Kata deleted.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

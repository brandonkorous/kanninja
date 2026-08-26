'use client';

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useMoveCard } from './use-cards';
import type { BoardWithChildren } from './use-boards';
import { indexForSlot } from '@/components/kanban/order-utils';
import { rearrangeForDragOver } from './card-rearrange';

/**
 * Drag-and-drop handlers for the kanban board, encapsulated so KanbanBoard
 * stays focused on layout. Implements dnd-kit's canonical multiple-
 * sortable-lists pattern: mutate the React Query cache *during* drag in
 * `onDragOver` so the underlying DOM is always at the position the user
 * is targeting. By the time the user releases, dnd-kit's drop animation
 * lands on the correct slot — no snap-back, no flash of stale state.
 *
 * The final fractional `orderIndex` is computed once at drop time (in
 * `onDragEnd`) and is what gets persisted to the server. Intermediate
 * cache states during drag have correct array order but stale orderIndex
 * values; that's fine because rendering trusts the array order.
 *
 * On a canceled drop or a failed mutation, the cache is reverted to the
 * pre-drag snapshot taken in `onDragStart`.
 */
export function useKanbanDrag(boardId: string) {
  const queryClient = useQueryClient();
  const moveCard = useMoveCard(boardId);
  const queryKey = ['boards', boardId] as const;

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  // Pre-drag cache snapshot for revert on cancel or mutation error.
  // Lives in a ref because nothing in the render path needs to react to it.
  const previousBoardRef = useRef<BoardWithChildren | null>(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveCardId(event.active.id as string);
      previousBoardRef.current =
        queryClient.getQueryData<BoardWithChildren>(queryKey) ?? null;
    },
    [queryClient, queryKey],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const board = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!board) return;

      const newLists = rearrangeForDragOver(
        board,
        active.id as string,
        over.id as string,
        over.data.current?.type,
      );
      if (!newLists) return;

      queryClient.setQueryData<BoardWithChildren>(queryKey, { ...board, lists: newLists });
    },
    [queryClient, queryKey],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCardId(null);
      const previousBoard = previousBoardRef.current;
      previousBoardRef.current = null;

      const { active, over } = event;
      const cardId = active.id as string;

      // No drop target — revert to the pre-drag snapshot.
      if (!over) {
        if (previousBoard) {
          queryClient.setQueryData(queryKey, previousBoard);
        }
        return;
      }

      // The cache already reflects the user's intended position from the
      // last onDragOver. Compute the final fractional orderIndex from the
      // moved card's neighbors and persist.
      const board = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!board) return;

      const targetList = board.lists.find((l) =>
        l.cards.some((c) => c.id === cardId),
      );
      if (!targetList) return;
      const targetIdx = targetList.cards.findIndex((c) => c.id === cardId);
      const prevCard = targetIdx > 0 ? targetList.cards[targetIdx - 1] : null;
      const nextCard =
        targetIdx < targetList.cards.length - 1
          ? targetList.cards[targetIdx + 1]
          : null;

      const newOrderIndex = indexForSlot(
        prevCard?.orderIndex ?? null,
        nextCard?.orderIndex ?? null,
      );

      // A head drop can exhaust the key space below the first card.
      // Rather than invent a colliding index, hand the decision to the
      // server as a symbolic position — it respaces the list and returns
      // a real head slot. The cache already holds the right array order.
      if (newOrderIndex === null) {
        moveCard.mutate(
          { cardId, listId: targetList.id, position: 'top' },
          {
            onError: () => {
              if (previousBoard) {
                queryClient.setQueryData(queryKey, previousBoard);
              }
            },
          },
        );
        return;
      }

      // No-op: dropped exactly where it started — bail before paying the
      // server round-trip and the realtime broadcast.
      if (previousBoard) {
        const oldList = previousBoard.lists.find((l) =>
          l.cards.some((c) => c.id === cardId),
        );
        const oldCard = oldList?.cards.find((c) => c.id === cardId);
        if (oldList?.id === targetList.id && oldCard?.orderIndex === newOrderIndex) {
          return;
        }
      }

      // Patch the moved card's orderIndex into the cache so it stays
      // self-consistent. Array order is already correct from onDragOver.
      queryClient.setQueryData<BoardWithChildren>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          lists: current.lists.map((list) => ({
            ...list,
            cards: list.cards.map((c) =>
              c.id === cardId
                ? { ...c, orderIndex: newOrderIndex, listId: targetList.id }
                : c,
            ),
          })),
        };
      });

      // Persist. The hook's onMutate re-applies the same update
      // (idempotent). On error, override the hook's rollback (which would
      // restore the post-drag cache state) with the pre-drag snapshot for
      // a clean revert. Per-call onError runs after hook-level onError.
      moveCard.mutate(
        { cardId, listId: targetList.id, orderIndex: newOrderIndex },
        {
          onError: () => {
            if (previousBoard) {
              queryClient.setQueryData(queryKey, previousBoard);
            }
          },
        },
      );
    },
    [queryClient, queryKey, moveCard],
  );

  return { activeCardId, handleDragStart, handleDragOver, handleDragEnd };
}

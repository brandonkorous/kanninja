'use client';

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useMoveCard } from './use-cards';
import type { BoardWithChildren } from './use-boards';
import {
  generateIndexBetween,
  generateIndexAfter,
  generateIndexBefore,
} from '@/components/kanban/order-utils';

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

      const activeId = active.id as string;
      const overId = over.id as string;
      const overData = over.data.current;

      const board = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!board) return;

      // Find the source list and the active card's index inside it.
      const sourceListIdx = board.lists.findIndex((l) =>
        l.cards.some((c) => c.id === activeId),
      );
      if (sourceListIdx === -1) return;
      const sourceList = board.lists[sourceListIdx];
      const activeIdx = sourceList.cards.findIndex((c) => c.id === activeId);

      // Determine target list + index. Hovering an empty column drops at
      // the end; hovering a card drops just before that card.
      let targetListIdx: number;
      let targetIdx: number;
      if (overData?.type === 'column') {
        targetListIdx = board.lists.findIndex((l) => l.id === overId);
        if (targetListIdx === -1) return;
        targetIdx = board.lists[targetListIdx].cards.length;
      } else {
        targetListIdx = board.lists.findIndex((l) =>
          l.cards.some((c) => c.id === overId),
        );
        if (targetListIdx === -1) return;
        targetIdx = board.lists[targetListIdx].cards.findIndex((c) => c.id === overId);
      }

      // No-op: already at this exact slot.
      if (sourceListIdx === targetListIdx && activeIdx === targetIdx) return;

      // Apply the rearrangement. We don't touch orderIndex here — array
      // order is what renders, and the final orderIndex is computed once
      // at drop time from the surviving neighbors' indexes.
      const newLists = board.lists.map((list, idx) => {
        if (sourceListIdx === targetListIdx && idx === sourceListIdx) {
          return { ...list, cards: arrayMove(list.cards, activeIdx, targetIdx) };
        }
        if (idx === sourceListIdx) {
          return { ...list, cards: list.cards.filter((c) => c.id !== activeId) };
        }
        if (idx === targetListIdx) {
          const movedCard = { ...sourceList.cards[activeIdx], listId: list.id };
          const nextCards = [...list.cards];
          nextCards.splice(targetIdx, 0, movedCard);
          return { ...list, cards: nextCards };
        }
        return list;
      });

      queryClient.setQueryData<BoardWithChildren>(queryKey, {
        ...board,
        lists: newLists,
      });
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

      let newOrderIndex: string;
      if (prevCard && nextCard) {
        newOrderIndex = generateIndexBetween(prevCard.orderIndex, nextCard.orderIndex);
      } else if (prevCard) {
        newOrderIndex = generateIndexAfter(prevCard.orderIndex);
      } else if (nextCard) {
        newOrderIndex = generateIndexBefore(nextCard.orderIndex);
      } else {
        newOrderIndex = 'n';
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

'use client';

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useReorderLists } from './use-lists';
import type { BoardWithChildren } from './use-boards';

/**
 * Column reordering for the kanban board — the sibling of
 * `useKanbanDrag`, which handles cards. Same shape and same strategy:
 * shuffle the React Query cache during `onDragOver` so the DOM always
 * matches where the user is aiming, then persist the final order once on
 * drop. A canceled drag reverts to the pre-drag snapshot.
 *
 * Columns carry no fractional index of their own here — the reorder
 * endpoint takes the full ordered id list and respaces server-side, so
 * there is nothing to compute at drop time.
 */
export function useListDrag(boardId: string) {
  const queryClient = useQueryClient();
  const reorderLists = useReorderLists(boardId);
  const queryKey = ['boards', boardId] as const;

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const previousBoardRef = useRef<BoardWithChildren | null>(null);

  /** Resolve a drop target to a column id — dropping onto a card counts
   *  as dropping onto the column that holds it. */
  const columnIdFor = useCallback(
    (board: BoardWithChildren, overId: string, overType?: string) => {
      if (overType === 'column') return overId;
      return board.lists.find((l) => l.cards.some((c) => c.id === overId))?.id ?? null;
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveListId(event.active.id as string);
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

      const overColumnId = columnIdFor(board, over.id as string, over.data.current?.type);
      if (!overColumnId || overColumnId === active.id) return;

      const from = board.lists.findIndex((l) => l.id === active.id);
      const to = board.lists.findIndex((l) => l.id === overColumnId);
      if (from === -1 || to === -1 || from === to) return;

      queryClient.setQueryData<BoardWithChildren>(queryKey, {
        ...board,
        lists: arrayMove(board.lists, from, to),
      });
    },
    [queryClient, queryKey, columnIdFor],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveListId(null);
      const previousBoard = previousBoardRef.current;
      previousBoardRef.current = null;

      if (!event.over) {
        if (previousBoard) queryClient.setQueryData(queryKey, previousBoard);
        return;
      }

      const board = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!board) return;

      const orderedIds = board.lists.map((l) => l.id);

      // Dropped back where it started — skip the round-trip.
      if (previousBoard?.lists.map((l) => l.id).join() === orderedIds.join()) return;

      reorderLists.mutate(orderedIds, {
        onError: () => {
          if (previousBoard) queryClient.setQueryData(queryKey, previousBoard);
        },
      });
    },
    [queryClient, queryKey, reorderLists],
  );

  /** Menu fallback: nudge a column one slot left or right. Same persist
   *  path as the drag, so both routes stay consistent. */
  const moveListBy = useCallback(
    (listId: string, delta: -1 | 1) => {
      const board = queryClient.getQueryData<BoardWithChildren>(queryKey);
      if (!board) return;

      const from = board.lists.findIndex((l) => l.id === listId);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= board.lists.length) return;

      const previousBoard = board;
      const nextLists = arrayMove(board.lists, from, to);
      queryClient.setQueryData<BoardWithChildren>(queryKey, {
        ...board,
        lists: nextLists,
      });

      reorderLists.mutate(
        nextLists.map((l) => l.id),
        {
          onError: () => queryClient.setQueryData(queryKey, previousBoard),
        },
      );
    },
    [queryClient, queryKey, reorderLists],
  );

  return { activeListId, handleDragStart, handleDragOver, handleDragEnd, moveListBy };
}

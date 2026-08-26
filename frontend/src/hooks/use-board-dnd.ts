'use client';

import { useCallback } from 'react';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useKanbanDrag } from './use-kanban-drag';
import { useListDrag } from './use-list-drag';

/**
 * One DndContext, two kinds of draggable: cards and columns. This routes
 * each event to the hook that owns that kind, keyed off the `type` the
 * draggable declares in its `data`. Keeping the two apart means neither
 * has to reason about the other's cache shape — cards move within and
 * between lists, columns move within the board.
 */
export function useBoardDnd(boardId: string) {
  const cards = useKanbanDrag(boardId);
  const lists = useListDrag(boardId);

  const isColumn = (event: { active: { data: { current?: { type?: string } } } }) =>
    event.active.data.current?.type === 'column';

  const handleDragStart = useCallback(
    (event: DragStartEvent) =>
      isColumn(event) ? lists.handleDragStart(event) : cards.handleDragStart(event),
    [cards, lists],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) =>
      isColumn(event) ? lists.handleDragOver(event) : cards.handleDragOver(event),
    [cards, lists],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) =>
      isColumn(event) ? lists.handleDragEnd(event) : cards.handleDragEnd(event),
    [cards, lists],
  );

  return {
    activeCardId: cards.activeCardId,
    activeListId: lists.activeListId,
    moveListBy: lists.moveListBy,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}

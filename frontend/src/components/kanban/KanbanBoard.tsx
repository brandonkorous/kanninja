'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCardPreview } from './KanbanCardPreview';
import { BoardEmptyState } from './BoardEmptyState';
import { AddListControl } from './AddListControl';
import { useCreateList } from '@/hooks/use-lists';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useBoardMembers, type BoardMember } from '@/hooks/use-board-members';
import { useBoardDnd } from '@/hooks/use-board-dnd';

interface CardData {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  priority: string;
  isCompleted: boolean;
  dueDate: string | null;
  orderIndex: string;
  assigneeId: string | null;
  createdBy: string;
  completedAt: string | null;
  estimatedHours: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface ListData {
  id: string;
  boardId: string;
  title: string;
  orderIndex: string;
  createdAt: string;
  updatedAt: string;
  cards: CardData[];
}

interface KanbanBoardProps {
  boardId: string;
  lists: ListData[];
  onCardClick: (cardId: string) => void;
}

export function KanbanBoard({ boardId, lists, onCardClick }: KanbanBoardProps) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const createList = useCreateList(boardId);
  // Role gate from the cached useBoard query — no prop drilling.
  const { canEdit } = useDojoPermissions(boardId);
  // One DndContext drives both cards and columns; the hook routes each
  // drag to the handler that owns that kind. See use-board-dnd.ts.
  const { activeCardId, activeListId, moveListBy, handleDragStart, handleDragOver, handleDragEnd } =
    useBoardDnd(boardId);
  const { data: members } = useBoardMembers(boardId);
  const memberMap = new Map<string, BoardMember>(
    members?.map((m) => [m.userId, m]) ?? [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeCard = activeCardId
    ? lists.flatMap((l) => l.cards).find((c) => c.id === activeCardId)
    : null;

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await createList.mutateAsync({ title: newListTitle.trim() });
    setNewListTitle('');
    setIsAddingList(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {lists.length === 0 && !isAddingList ? (
        <BoardEmptyState canEdit={canEdit} onAddList={() => setIsAddingList(true)} />
      ) : (
        /* `h-full` + per-column overflow: the board scrolls sideways, each
         * lane scrolls on its own, and the page itself never moves. */
        <div className="flex gap-6 overflow-x-auto pb-4 h-full items-stretch snap-x snap-mandatory scroll-px-4 px-4 sm:px-0 sm:scroll-px-0">
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            {lists.map((list, index) => (
              <KanbanColumn
                key={list.id}
                id={list.id}
                boardId={boardId}
                title={list.title}
                cards={list.cards}
                memberMap={memberMap}
                onCardClick={onCardClick}
                onMoveLeft={() => moveListBy(list.id, -1)}
                onMoveRight={() => moveListBy(list.id, 1)}
                isFirstColumn={index === 0}
                isLastColumn={index === lists.length - 1}
              />
            ))}
          </SortableContext>

          {/* Add list — gated on canEdit per editing-patterns.md */}
          {canEdit && (
            <AddListControl
              isAdding={isAddingList}
              title={newListTitle}
              onTitleChange={setNewListTitle}
              onSubmit={handleAddList}
              onOpen={() => setIsAddingList(true)}
              onCancel={() => {
                setNewListTitle('');
                setIsAddingList(false);
              }}
            />
          )}
        </div>
      )}

      {/* Cards drag via an overlay. Columns don't — they translate in place
        * so the surrounding lanes visibly part to make room. Guarding on
        * activeListId keeps the two from ever rendering at once. */}
      <DragOverlay>
        {activeCard && !activeListId && (
          <KanbanCardPreview
            title={activeCard.title}
            description={activeCard.description}
            priority={activeCard.priority}
            isCompleted={activeCard.isCompleted}
            dueDate={activeCard.dueDate}
            assigneeAvatarUrl={activeCard.assigneeId ? memberMap.get(activeCard.assigneeId)?.avatarUrl : undefined}
            assigneeDisplayName={activeCard.assigneeId ? memberMap.get(activeCard.assigneeId)?.displayName : undefined}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

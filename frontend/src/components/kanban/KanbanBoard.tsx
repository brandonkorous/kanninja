'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCardPreview } from './KanbanCardPreview';
import { useCreateList } from '@/hooks/use-lists';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useBoardMembers, type BoardMember } from '@/hooks/use-board-members';
import { useKanbanDrag } from '@/hooks/use-kanban-drag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

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
  // dnd-kit handlers live in a hook so the cache-mutation plumbing
  // doesn't crowd this component. Implements the canonical multiple-
  // sortable-lists pattern: rearrange in onDragOver, persist on drop.
  const { activeCardId, handleDragStart, handleDragOver, handleDragEnd } =
    useKanbanDrag(boardId);
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
        /* Empty dojo — matches the canonical Hanko empty-state pattern
         * used on /dashboard and /clans: card wrapper, ninja icon at
         * top, text-3xl headline with single-word italic-vermillion
         * stamp, body copy, primary CTA wrapped in mt-10. For viewers
         * (canEdit=false), the button is hidden and the copy softens. */
        <div className="bg-base-100 rounded-lg shadow-e1 p-12 md:p-16 max-w-2xl flex flex-col items-start">
          <Image
            src="/brand/nin-icon.svg"
            alt=""
            width={80}
            height={80}
            className="h-20 w-20"
          />
          <h2 className="mt-10 font-display text-3xl font-medium tracking-tight">
            {canEdit ? (
              <>
                A new dojo.{' '}
                <span className="italic text-primary">Begin.</span>
              </>
            ) : (
              <>
                Nothing here <span className="italic text-primary">yet.</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-base text-base-content/70 max-w-md">
            {canEdit
              ? 'Lists hold the stances of your practice. Start with the ones you need — backlog, in progress, done. You can rename them later.'
              : 'This dojo has no lists yet. Check back once an owner adds one.'}
          </p>
          {canEdit && (
            <div className="mt-10">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddingList(true)}
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
                Add your first list
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start snap-x snap-mandatory scroll-px-4 px-4 sm:px-0 sm:scroll-px-0">
          {lists.map((list) => (
            <KanbanColumn
              key={list.id}
              id={list.id}
              boardId={boardId}
              title={list.title}
              cards={list.cards}
              memberMap={memberMap}
              onCardClick={onCardClick}
            />
          ))}

          {/* Add list — gated on canEdit per editing-patterns.md */}
          {canEdit && (
          <div className="w-72 shrink-0">
            {isAddingList ? (
              <form onSubmit={handleAddList} className="bg-base-200 rounded-xl p-3 space-y-2">
                <input
                  className="input input-sm input-bordered w-full"
                  placeholder="List title"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm md:btn-xs"
                    disabled={!newListTitle.trim()}
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm md:btn-xs"
                    onClick={() => setIsAddingList(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="btn btn-ghost w-full justify-start text-base-content/70 border border-dashed border-base-300 hover:border-base-content/40 hover:bg-transparent"
                onClick={() => setIsAddingList(true)}
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" /> Add another list
              </button>
            )}
          </div>
          )}
        </div>
      )}

      <DragOverlay>
        {activeCard && (
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

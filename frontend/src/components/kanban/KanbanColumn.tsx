'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { KanbanColumnHeader } from './KanbanColumnHeader';
import { pickEmptyPhrase } from './empty-phrases';
import { generateIndexAfter, generateIndexBefore } from './order-utils';
import { useCreateCard, useMoveCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { BoardMember } from '@/hooks/use-board-members';

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
}

interface KanbanColumnProps {
  id: string;
  boardId: string;
  title: string;
  cards: CardData[];
  memberMap: Map<string, BoardMember>;
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({
  id,
  boardId,
  title,
  cards,
  memberMap,
  onCardClick,
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const createCard = useCreateCard(boardId);
  const moveCard = useMoveCard(boardId);
  const { canEdit } = useDojoPermissions(boardId);

  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column' } });

  // Peak brand moment: when every kata in this lane is sealed, the column
  // earns the vermillion stamp. Two quiet signals — the hairline rule turns
  // vermillion down the full height, and the count badge becomes a filled
  // vermillion stamp. Empty columns never count as sealed.
  const allSealed = cards.length > 0 && cards.every((c) => c.isCompleted);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await createCard.mutateAsync({ listId: id, title: newCardTitle.trim() });
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  // Menu-driven reposition. The column knows the full ordered card list, so
  // it's the natural owner of the "move to top/bottom" logic. Passing bound
  // callbacks down into KanbanCard keeps the card ignorant of its siblings.
  const handleMoveToTop = (cardId: string) => {
    const firstCard = cards[0];
    if (!firstCard || firstCard.id === cardId) return;
    moveCard.mutate({
      cardId,
      listId: id,
      orderIndex: generateIndexBefore(firstCard.orderIndex),
    });
  };

  const handleMoveToBottom = (cardId: string) => {
    const lastCard = cards[cards.length - 1];
    if (!lastCard || lastCard.id === cardId) return;
    moveCard.mutate({
      cardId,
      listId: id,
      orderIndex: generateIndexAfter(lastCard.orderIndex),
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 snap-start border-l pl-3 transition-colors ${
        isOver
          ? 'border-l-base-content/40 bg-base-100/40'
          : allSealed
            ? 'border-l-primary'
            : 'border-l-base-300'
      }`}
    >
      <KanbanColumnHeader
        id={id}
        boardId={boardId}
        title={title}
        allSealed={allSealed}
        cardsCount={cards.length}
      />

      {/* Cards — intentionally NOT overflow-y-auto. A clip region would
        * trap dropdown menus inside the column lane, and the kanban already
        * lives inside the page's own scroll container. Let the lane grow. */}
      <div className="flex-1 pr-2 pb-2 space-y-3 min-h-[60px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 && !isAddingCard ? (
            <p className="text-sm text-base-content/50 italic px-1 py-2">
              {pickEmptyPhrase(id)}
            </p>
          ) : (
            cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                id={card.id}
                boardId={boardId}
                title={card.title}
                description={card.description}
                priority={card.priority}
                isCompleted={card.isCompleted}
                dueDate={card.dueDate}
                assigneeAvatarUrl={card.assigneeId ? memberMap.get(card.assigneeId)?.avatarUrl : undefined}
                assigneeDisplayName={card.assigneeId ? memberMap.get(card.assigneeId)?.displayName : undefined}
                onClick={() => onCardClick(card.id)}
                onMoveToTop={() => handleMoveToTop(card.id)}
                onMoveToBottom={() => handleMoveToBottom(card.id)}
                isFirst={index === 0}
                isLast={index === cards.length - 1}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add card — gated on canEdit per editing-patterns.md */}
      {canEdit && (
        <div className="pr-2 pb-2">
          {isAddingCard ? (
            <form onSubmit={handleAddCard} className="space-y-2">
              <input
                className="input input-sm input-bordered w-full"
                placeholder="Kata title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                autoFocus
                onBlur={() => !newCardTitle.trim() && setIsAddingCard(false)}
              />
              <div className="flex gap-1">
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm md:btn-xs"
                  disabled={!newCardTitle.trim()}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm md:btn-xs"
                  onClick={() => setIsAddingCard(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn-ghost btn-sm w-full justify-start text-base-content/70"
              onClick={() => setIsAddingCard(true)}
            >
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" /> Add a kata
            </button>
          )}
        </div>
      )}
    </div>
  );
}

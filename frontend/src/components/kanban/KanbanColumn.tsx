'use client';

import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import { KanbanColumnHeader } from './KanbanColumnHeader';
import { AddCardForm } from './AddCardForm';
import { pickEmptyPhrase } from './empty-phrases';
import { useMoveCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
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
  /** Menu fallback for column reordering — the keyboard-reachable
   *  equivalent of dragging the header grip. Owned by KanbanBoard, which
   *  holds the full ordered list of columns. */
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirstColumn: boolean;
  isLastColumn: boolean;
}

export function KanbanColumn({
  id,
  boardId,
  title,
  cards,
  memberMap,
  onCardClick,
  onMoveLeft,
  onMoveRight,
  isFirstColumn,
  isLastColumn,
}: KanbanColumnProps) {
  const moveCard = useMoveCard(boardId);
  const { canEdit } = useDojoPermissions(boardId);

  // The column is both a sortable item (reordering columns) and the drop
  // target for cards landing in an empty lane. `useSortable` provides both
  // — `data.type` is how the drag handlers tell the two apart.
  const {
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, data: { type: 'column' } });

  // Peak brand moment: when every kata in this lane is sealed, the column
  // earns the vermillion stamp. Two quiet signals — the hairline rule turns
  // vermillion down the full height, and the count badge becomes a filled
  // vermillion stamp. Empty columns never count as sealed.
  const allSealed = cards.length > 0 && cards.every((c) => c.isCompleted);

  // Menu-driven reposition. `position` is symbolic rather than a computed
  // index: the server resolves it against the live list, so it stays
  // correct even when the fractional key space needs respacing.
  const handleMoveToTop = (cardId: string) => {
    if (cards[0]?.id === cardId) return;
    moveCard.mutate({ cardId, listId: id, position: 'top' });
  };

  const handleMoveToBottom = (cardId: string) => {
    if (cards[cards.length - 1]?.id === cardId) return;
    moveCard.mutate({ cardId, listId: id, position: 'bottom' });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex flex-col h-full w-72 shrink-0 snap-start border-l pl-3 transition-colors ${
        /* No DragOverlay for columns — the lane itself translates under
         * the pointer, so it needs to read as picked up and sit above its
         * neighbours while it travels. */
        isDragging ? 'z-20 bg-base-100 rounded-r-lg shadow-e2' : ''
      } ${
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
        /* Listeners only, not `attributes`. Those advertise keyboard
         * dragging via role/tabIndex, and no KeyboardSensor is
         * registered — the menu's Move left / Move right is the
         * keyboard path instead. */
        dragHandleProps={listeners ?? {}}
        onMoveLeft={onMoveLeft}
        onMoveRight={onMoveRight}
        isFirstColumn={isFirstColumn}
        isLastColumn={isLastColumn}
      />

      {/* Add card sits above the list because that is where the new kata
        * lands. Outside the scroll region so it stays reachable no matter
        * how deep the lane gets. Gated on canEdit per editing-patterns.md. */}
      {canEdit && <div className="pr-2 pb-3"><AddCardForm listId={id} boardId={boardId} /></div>}

      {/* Cards scroll within the lane, so a tall column never drags the
        * whole page with it. Safe to clip: `Menu` portals to document.body
        * and repositions on capture-phase scroll, so card and column menus
        * escape this overflow. */}
      <div className="flex-1 overflow-y-auto overscroll-contain pr-2 pb-2 space-y-3 min-h-[60px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 ? (
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
    </div>
  );
}

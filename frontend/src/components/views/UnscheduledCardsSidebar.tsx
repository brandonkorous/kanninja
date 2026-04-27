'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { priorityColor } from '@/lib/card-colors';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

interface UnscheduledCardItemProps {
  card: ScheduledCard;
  canEdit: boolean;
  onClick: () => void;
}

function UnscheduledCardItem({ card, canEdit, onClick }: UnscheduledCardItemProps) {
  const colors = priorityColor(card.priority);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unscheduled-${card.id}`,
    data: { type: 'unscheduled-card', cardId: card.id, card },
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={`group block w-full text-left rounded-md px-3 py-2 border-l-4 ${colors.border} bg-base-100 border border-base-300 ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:shadow-e1 focus-visible:shadow-focus focus-visible:outline-none transition-shadow`}
    >
      <p className="text-sm font-medium truncate">{card.title}</p>
      <p className="mt-0.5 text-eyebrow font-mono uppercase tracking-widest text-base-content/40 truncate">
        {card.listTitle}
      </p>
    </button>
  );
}

interface UnscheduledCardsSidebarProps {
  cards: ScheduledCard[];
  isOpen: boolean;
  canEdit: boolean;
  onCardClick: (cardId: string) => void;
  onClose: () => void;
}

/**
 * Right-side drawer listing cards without dates. Each item is a
 * drag source — drop onto a calendar day or timeline row to schedule.
 * Shared between Calendar and Timeline views; lives at the views/
 * root rather than under either view's folder.
 */
export function UnscheduledCardsSidebar({
  cards,
  isOpen,
  canEdit,
  onCardClick,
  onClose,
}: UnscheduledCardsSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Unscheduled kata"
      className="w-72 shrink-0 bg-base-200/40 border-l border-base-300 flex flex-col overflow-hidden"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-base-300">
        <h3 className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
          Unscheduled · {cards.length}
        </h3>
        <button
          type="button"
          aria-label="Close unscheduled drawer"
          className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cards.length === 0 ? (
          <p className="px-1 py-4 text-sm text-base-content/50 italic">
            Every kata has a date. Quiet day.
          </p>
        ) : (
          cards.map((card) => (
            <UnscheduledCardItem
              key={card.id}
              card={card}
              canEdit={canEdit}
              onClick={() => onCardClick(card.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

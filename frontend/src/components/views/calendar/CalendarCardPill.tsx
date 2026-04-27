'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { dojoColorClass, priorityColor } from '@/lib/card-colors';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

interface CalendarCardPillProps {
  card: ScheduledCard;
  /** The day this pill is rendered in — used as the "from" reference
   *  for shiftCardDates so a span-card stays a span-card after drag.
   *  Encoded into the dnd-kit drag data so the drop handler can
   *  compute the new dates without reaching back into state. */
  day: Date;
  canEdit: boolean;
  onClick: () => void;
  /** Clan calendars set this so the pill grows a thin dojo-color
   *  left stripe — disambiguates dojos at a glance when many share
   *  the canvas. Dojo calendars omit it (every pill is the same dojo
   *  so the stripe would be noise). */
  dojoAccent?: boolean;
}

/**
 * One card rendered inside a calendar day cell. Compact pill with a
 * priority-colored fill and the card title — avoids cluttering the
 * grid with full meta. Click opens the existing detail modal so
 * editing is a single, consistent surface across views.
 */
export function CalendarCardPill({
  card,
  day,
  canEdit,
  onClick,
  dojoAccent,
}: CalendarCardPillProps) {
  const colors = priorityColor(card.priority);
  const dojoStripe = dojoAccent ? dojoColorClass(card.boardId, card.boardColor) : '';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cal-card-${card.id}-${day.toISOString().slice(0, 10)}`,
    data: { type: 'calendar-card', cardId: card.id, fromDay: day.toISOString(), card },
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
      title={dojoAccent ? `${card.title} · ${card.boardTitle}` : card.title}
      className={`group block w-full text-left truncate rounded-md px-2 py-1 text-xs font-medium border ${colors.bg} ${colors.border} ${
        dojoAccent ? `border-l-4 ${dojoStripe}` : ''
      } ${card.isCompleted ? 'line-through opacity-60' : ''} ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:shadow-e1 focus-visible:shadow-focus focus-visible:outline-none transition-shadow`}
    >
      <span className="truncate">{card.title}</span>
    </button>
  );
}

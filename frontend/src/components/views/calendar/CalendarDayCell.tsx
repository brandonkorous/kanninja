'use client';

import { useDroppable } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { isSameDay } from '@/lib/calendar-dates';
import { CalendarCardPill } from './CalendarCardPill';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

interface CalendarDayCellProps {
  day: Date;
  cards: ScheduledCard[];
  isCurrentMonth: boolean;
  canEdit: boolean;
  onCardClick: (cardId: string) => void;
  /** Forwarded to each CalendarCardPill — clan calendar sets it so
   *  pills grow a dojo-color stripe. */
  dojoAccent?: boolean;
  /** Optional click handler for the hover-revealed "+ add" affordance.
   *  When omitted, the affordance doesn't render — clan calendar omits
   *  it because there's no implicit dojo to write to. */
  onAddClick?: (day: Date) => void;
}

const TODAY = new Date();
const MAX_VISIBLE = 3;

/**
 * One day in the month grid. Droppable target for drag-to-reschedule,
 * with a "+N more" overflow indicator when a day has more cards than
 * the cell can comfortably show. Out-of-month days are dimmed but
 * still droppable so dragging onto a spillover day silently advances
 * to the next month's data on the next render.
 */
export function CalendarDayCell({
  day,
  cards,
  isCurrentMonth,
  canEdit,
  onCardClick,
  dojoAccent,
  onAddClick,
}: CalendarDayCellProps) {
  const isToday = isSameDay(day, TODAY);
  const { setNodeRef, isOver } = useDroppable({
    id: `cal-day-${day.toISOString().slice(0, 10)}`,
    data: { type: 'calendar-day', day: day.toISOString() },
    disabled: !canEdit,
  });

  const visible = cards.slice(0, MAX_VISIBLE);
  const overflow = cards.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      className={`group relative min-h-[7rem] border-r border-b border-base-300 p-1.5 flex flex-col gap-1 transition-colors ${
        isCurrentMonth ? 'bg-base-100' : 'bg-base-200/40'
      } ${isOver ? 'bg-primary/5 ring-2 ring-primary/40 ring-inset' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-mono ${
            isToday
              ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-content'
              : isCurrentMonth
                ? 'text-base-content/70'
                : 'text-base-content/30'
          }`}
        >
          {day.getDate()}
        </span>
        {canEdit && onAddClick && (
          <button
            type="button"
            aria-label={`Add a kata on ${day.toLocaleDateString()}`}
            onClick={(e) => {
              e.stopPropagation();
              onAddClick(day);
            }}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:!opacity-100 w-5 h-5 inline-flex items-center justify-center rounded-md text-xs text-base-content/40 hover:text-primary hover:bg-base-200 transition-opacity"
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        {visible.map((card) => (
          <CalendarCardPill
            key={card.id}
            card={card}
            day={day}
            canEdit={canEdit}
            onClick={() => onCardClick(card.id)}
            dojoAccent={dojoAccent}
          />
        ))}
        {overflow > 0 && (
          <p className="px-1 text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
            +{overflow} more
          </p>
        )}
      </div>
    </div>
  );
}

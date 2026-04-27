'use client';

import { useDroppable } from '@dnd-kit/core';
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
      className={`relative min-h-[7rem] border-r border-b border-base-300 p-1.5 flex flex-col gap-1 transition-colors ${
        isCurrentMonth ? 'bg-base-100' : 'bg-base-200/40'
      } ${isOver ? 'bg-primary/5 ring-2 ring-primary/40 ring-inset' : ''}`}
    >
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

'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { dojoColorClass, priorityColor } from '@/lib/card-colors';
import type { CardSpan } from '@/lib/timeline-dates';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

interface TimelineBarProps {
  card: ScheduledCard;
  span: CardSpan;
  /** Anchor day used by the drop handler to compute the drag delta.
   *  For span-cards it's the card's actual start day (so dragging
   *  preserves the span). For single-day cards it's that one day.
   *  Container is responsible for the bar's column position; the
   *  bar fills 100% of whatever cell it's placed in. */
  anchorDay: Date;
  canEdit: boolean;
  onClick: () => void;
  /** Clan timelines pass `true` so the bar grows a dojo-color left
   *  stripe — disambiguates dojos when lanes are dojos themselves
   *  AND when bars from other dojos appear nearby. */
  dojoAccent?: boolean;
}

/**
 * One card rendered as a horizontal bar across the timeline columns.
 * Single-date cards (no span) render as a narrow marker rather than
 * a full bar — easier to spot at a glance and signals "schedule
 * pending" since the implied span is the smart-suggest target.
 *
 * Bars that extend beyond the visible window get a chevron on the
 * clipped edge so the truncation reads as intentional.
 */
export function TimelineBar({
  card,
  span,
  anchorDay,
  canEdit,
  onClick,
  dojoAccent,
}: TimelineBarProps) {
  const colors = priorityColor(card.priority);
  const dojoStripe = dojoAccent ? dojoColorClass(card.boardId, card.boardColor) : '';
  const isSingleDay = span.span === 1 && !card.startDate !== !card.dueDate;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tl-card-${card.id}-${anchorDay.toISOString().slice(0, 10)}`,
    data: {
      type: 'timeline-card',
      cardId: card.id,
      fromDay: anchorDay.toISOString(),
      card,
    },
    disabled: !canEdit,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...attributes}
      {...listeners}
      title={dojoAccent ? `${card.title} · ${card.boardTitle}` : card.title}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`block w-[calc(100%-4px)] mx-0.5 my-1 flex items-center gap-1 px-2 py-1 text-xs font-medium border ${colors.bg} ${colors.border} rounded-md text-left truncate ${
        dojoAccent ? `border-l-4 ${dojoStripe}` : ''
      } ${card.isCompleted ? 'line-through opacity-60' : ''} ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:shadow-e1 focus-visible:shadow-focus focus-visible:outline-none transition-shadow ${
        isSingleDay ? 'justify-center' : ''
      }`}
    >
      {span.clippedStart && (
        <FontAwesomeIcon
          icon={faAngleLeft}
          aria-label="Extends earlier"
          className="text-base-content/40 shrink-0"
        />
      )}
      <span className="truncate">{card.title}</span>
      {span.clippedEnd && (
        <FontAwesomeIcon
          icon={faAngleRight}
          aria-label="Extends later"
          className="text-base-content/40 shrink-0 ml-auto"
        />
      )}
    </button>
  );
}

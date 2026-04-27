'use client';

import { useRef, useState } from 'react';
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
  /** Anchor day used by the drop handler to compute the drag delta. */
  anchorDay: Date;
  canEdit: boolean;
  onClick: () => void;
  /** Clan timelines pass `true` so the bar grows a dojo-color stripe. */
  dojoAccent?: boolean;
  /** Called when an edge handle is released after a non-zero drag.
   *  When omitted (or canEdit=false) the handles are hidden. */
  onResize?: (cardId: string, edge: 'start' | 'end', deltaDays: number) => void;
}

/**
 * One card rendered as a horizontal bar across the timeline columns.
 * Edges expose hover-revealed resize handles when the parent provides
 * an `onResize` callback — drag a handle to extend or shrink the span
 * by whole days. The handle's pointer-events stop short of dnd-kit's
 * activation so the body of the bar stays draggable for repositioning.
 */
export function TimelineBar({
  card,
  span,
  anchorDay,
  canEdit,
  onClick,
  dojoAccent,
  onResize,
}: TimelineBarProps) {
  const colors = priorityColor(card.priority);
  const dojoStripe = dojoAccent ? dojoColorClass(card.boardId, card.boardColor) : '';
  const isSingleDay = span.span === 1 && !card.startDate !== !card.dueDate;
  const showResize = canEdit && !!onResize;

  const barRef = useRef<HTMLButtonElement | null>(null);
  const isResizingRef = useRef(false);
  const [resizePreview, setResizePreview] = useState<{ edge: 'start' | 'end'; days: number } | null>(null);

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

  // Combine dnd-kit's ref with our own measurement ref. dnd-kit needs
  // the node for activator wiring; we need it to compute cell width
  // for the px → days conversion during resize.
  const setRefs = (node: HTMLButtonElement | null) => {
    setNodeRef(node);
    barRef.current = node;
  };

  const startResize = (edge: 'start' | 'end') => (e: React.PointerEvent) => {
    if (!showResize) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const rect = barRef.current?.getBoundingClientRect();
    const cellWidth = rect ? rect.width / Math.max(span.span, 1) : 0;
    if (!cellWidth) return;

    isResizingRef.current = true;
    setResizePreview({ edge, days: 0 });

    const onMove = (ev: PointerEvent) => {
      const deltaPx = ev.clientX - startX;
      const days = Math.round(deltaPx / cellWidth);
      setResizePreview({ edge, days });
    };
    const onUp = (ev: PointerEvent) => {
      const deltaPx = ev.clientX - startX;
      const days = Math.round(deltaPx / cellWidth);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setResizePreview(null);
      // Defer click-suppression flag clear past the synthetic click
      // event that pointerup will emit on the parent button.
      setTimeout(() => {
        isResizingRef.current = false;
      }, 0);
      if (days !== 0) onResize?.(card.id, edge, days);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isResizingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  const previewLabel = resizePreview
    ? `${resizePreview.days > 0 ? '+' : ''}${resizePreview.days}d`
    : null;

  return (
    <button
      ref={setRefs}
      type="button"
      onClick={handleClick}
      {...attributes}
      {...listeners}
      title={dojoAccent ? `${card.title} · ${card.boardTitle}` : card.title}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`relative block w-[calc(100%-4px)] mx-0.5 my-1 flex items-center gap-1 px-2 py-1 text-xs font-medium border ${colors.bg} ${colors.border} rounded-md text-left truncate ${
        dojoAccent ? `border-l-4 ${dojoStripe}` : ''
      } ${card.isCompleted ? 'line-through opacity-60' : ''} ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:shadow-e1 focus-visible:shadow-focus focus-visible:outline-none transition-shadow ${
        isSingleDay ? 'justify-center' : ''
      } ${resizePreview ? 'ring-2 ring-primary/40' : ''}`}
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

      {showResize && !span.clippedStart && (
        <span
          role="presentation"
          onPointerDown={startResize('start')}
          aria-label="Resize start date"
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 hover:bg-primary/30 rounded-l-md transition-opacity"
        />
      )}
      {showResize && !span.clippedEnd && (
        <span
          role="presentation"
          onPointerDown={startResize('end')}
          aria-label="Resize due date"
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 hover:bg-primary/30 rounded-r-md transition-opacity"
        />
      )}

      {previewLabel && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-base-content text-base-100 text-eyebrow font-mono uppercase tracking-widest pointer-events-none whitespace-nowrap">
          {previewLabel}
        </span>
      )}
    </button>
  );
}

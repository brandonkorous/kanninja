'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { isSameDay } from '@/lib/calendar-dates';
import { cardSpanInWindow, type CardSpan, type TimelineWindow } from '@/lib/timeline-dates';
import { TimelineBar } from './TimelineBar';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

interface TimelineRowProps {
  laneId: string;
  laneTitle: string;
  cards: ScheduledCard[];
  win: TimelineWindow;
  days: Date[];
  laneGutterWidth: string;
  canEdit: boolean;
  onCardClick: (cardId: string) => void;
  /** Forwarded to each TimelineBar — clan timelines pass `true` so
   *  bars grow a dojo-color stripe for cross-dojo disambiguation. */
  dojoAccent?: boolean;
  /** When set, the lane gutter shows a "+" affordance that calls this
   *  with the lane id. Dojo timeline wires it to open quick-add with
   *  the list pre-selected; clan timeline omits it (no implicit
   *  dojo). */
  onAddClick?: (laneId: string) => void;
  /** Forwarded to each TimelineBar. When omitted, edge-resize handles
   *  are hidden. */
  onResize?: (cardId: string, edge: 'start' | 'end', deltaDays: number) => void;
}

const TODAY = new Date();
const BAR_ROW_HEIGHT_REM = 1.75;
const BAR_ROW_GAP_REM = 0.25;
const BASE_LANE_HEIGHT_REM = 3.5;

interface DropCellProps {
  laneId: string;
  day: Date;
  canEdit: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

function DropCell({ laneId, day, canEdit, isToday, isWeekend }: DropCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tl-cell-${laneId}-${day.toISOString().slice(0, 10)}`,
    data: { type: 'timeline-day', day: day.toISOString() },
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-r border-base-300 transition-colors ${
        isWeekend ? 'bg-base-200/30' : ''
      } ${isToday ? 'bg-primary/[0.03]' : ''} ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/40 ring-inset' : ''
      }`}
    />
  );
}

interface PlacedBar {
  card: ScheduledCard;
  span: CardSpan;
  /** Stack row (0-indexed) within the lane. Bars on the same row do
   *  not overlap horizontally; bars on different rows do. Computed
   *  greedily by ascending startIdx. */
  stackRow: number;
}

/**
 * Greedy interval-graph coloring: place each bar in the lowest row
 * where it doesn't collide with an existing bar. O(N²) worst case
 * but N is the bar count for ONE lane, so it's tiny in practice.
 */
function packBars(cards: ScheduledCard[], win: TimelineWindow): {
  placed: PlacedBar[];
  stackHeight: number;
} {
  const withSpans = cards
    .map((card) => ({ card, span: cardSpanInWindow(card, win) }))
    .filter((x): x is { card: ScheduledCard; span: CardSpan } => x.span !== null)
    .sort((a, b) => a.span.startIdx - b.span.startIdx);

  const rows: PlacedBar[][] = [];
  const placed: PlacedBar[] = [];

  for (const { card, span } of withSpans) {
    let chosen = -1;
    for (let r = 0; r < rows.length; r++) {
      const lastInRow = rows[r][rows[r].length - 1];
      if (lastInRow.span.startIdx + lastInRow.span.span <= span.startIdx) {
        chosen = r;
        break;
      }
    }
    if (chosen === -1) {
      chosen = rows.length;
      rows.push([]);
    }
    const placedBar: PlacedBar = { card, span, stackRow: chosen };
    rows[chosen].push(placedBar);
    placed.push(placedBar);
  }

  return { placed, stackHeight: rows.length };
}

/**
 * One lane in the timeline. Lane label + droppable day cells + bars
 * for any cards overlapping the visible window. Bars are stacked
 * into non-overlapping rows so a multi-day kata sharing days with a
 * single-day kata renders on a separate row instead of obscuring it.
 *
 * The lane height grows with the bar stack so two-deep stacks don't
 * spill into the next lane (the bug the absolute overlay alone had).
 */
export function TimelineRow({
  laneId,
  laneTitle,
  cards,
  win,
  days,
  laneGutterWidth,
  canEdit,
  onCardClick,
  dojoAccent,
  onAddClick,
  onResize,
}: TimelineRowProps) {
  const { placed, stackHeight } = useMemo(() => packBars(cards, win), [cards, win]);

  const barsAreaHeight =
    stackHeight > 0
      ? stackHeight * BAR_ROW_HEIGHT_REM + (stackHeight + 1) * BAR_ROW_GAP_REM
      : 0;
  const minHeight = `${Math.max(BASE_LANE_HEIGHT_REM, barsAreaHeight)}rem`;

  return (
    <div
      className="grid border-b border-base-300 relative"
      style={{
        gridTemplateColumns: `${laneGutterWidth} repeat(${days.length}, minmax(0, 1fr))`,
        minHeight,
      }}
    >
      <div className="group/lane px-3 py-3 border-r border-base-300 bg-base-100 sticky left-0 z-[5] flex items-center justify-between gap-2 text-sm font-medium">
        <span className="truncate min-w-0">{laneTitle}</span>
        {canEdit && onAddClick && (
          <button
            type="button"
            aria-label={`Add a kata to ${laneTitle}`}
            onClick={() => onAddClick(laneId)}
            className="opacity-0 group-hover/lane:opacity-100 focus-visible:opacity-100 hover:!opacity-100 w-5 h-5 inline-flex items-center justify-center rounded-md text-xs text-base-content/40 hover:text-primary hover:bg-base-200 shrink-0 transition-opacity"
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          </button>
        )}
      </div>

      {days.map((day) => (
        <DropCell
          key={day.toISOString()}
          laneId={laneId}
          day={day}
          canEdit={canEdit}
          isToday={isSameDay(day, TODAY)}
          isWeekend={day.getDay() === 0 || day.getDay() === 6}
        />
      ))}

      {/* Bars overlay grid. Each bar gets an explicit gridRow from
        * the pack-bars algorithm so overlapping spans never collide
        * vertically — they stack into separate rows of the lane. */}
      <div
        className="absolute inset-0 grid pointer-events-none"
        style={{
          gridTemplateColumns: `${laneGutterWidth} repeat(${days.length}, minmax(0, 1fr))`,
          gridAutoRows: `${BAR_ROW_HEIGHT_REM}rem`,
          rowGap: `${BAR_ROW_GAP_REM}rem`,
          paddingTop: `${BAR_ROW_GAP_REM}rem`,
        }}
      >
        {placed.map(({ card, span, stackRow }) => (
          <div
            key={card.id}
            className="pointer-events-auto"
            style={{
              gridColumnStart: span.startIdx + 2,
              gridColumnEnd: `span ${span.span}`,
              gridRow: stackRow + 1,
            }}
          >
            <TimelineBar
              card={card}
              span={span}
              anchorDay={days[span.startIdx]}
              canEdit={canEdit}
              onClick={() => onCardClick(card.id)}
              dojoAccent={dojoAccent}
              onResize={onResize}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

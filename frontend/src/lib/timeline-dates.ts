/**
 * Timeline-specific date utilities. Layered on top of calendar-dates
 * (shares startOfDay/addDays/etc.) but adds the math the Gantt-style
 * view needs: zoom levels, window ranges, and span-to-pixel mapping.
 *
 * Like the calendar, the timeline treats `startDate`/`dueDate` as
 * date-only labels — bars are positioned by date keys, never by
 * absolute timestamps. See lib/due-dates for the contract.
 */

import { addDays, localDateKey, startOfDay } from './calendar-dates';
import { dueDateKey } from './due-dates';

export type TimelineZoom = 'week' | 'month';

export interface TimelineWindow {
  /** First visible day (local midnight). */
  start: Date;
  /** Number of days the window spans. */
  days: number;
  zoom: TimelineZoom;
}

const ZOOM_DAYS: Record<TimelineZoom, number> = {
  week: 7,
  month: 28,
};

export function buildWindow(start: Date, zoom: TimelineZoom): TimelineWindow {
  return { start: startOfDay(start), days: ZOOM_DAYS[zoom], zoom };
}

/** Array of every day in the window, for rendering the axis + cells. */
export function windowDays(win: TimelineWindow): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < win.days; i++) days.push(addDays(win.start, i));
  return days;
}

/** Shift the window forward / backward by one zoom unit. */
export function shiftWindow(win: TimelineWindow, direction: 1 | -1): TimelineWindow {
  return buildWindow(addDays(win.start, win.days * direction), win.zoom);
}

/** ISO range of the window — used as `from`/`to` query params. */
export function windowRange(win: TimelineWindow): { from: string; to: string } {
  // Pad by a day on each side so date-only cards on the boundary
  // aren't dropped by the absolute-timestamp filter (same reason as
  // calendar-dates.monthGridRange).
  return {
    from: startOfDay(addDays(win.start, -1)).toISOString(),
    to: startOfDay(addDays(win.start, win.days + 1)).toISOString(),
  };
}

export interface CardSpan {
  /** First column index (inclusive) the card overlaps. May clip to 0
   *  if the card starts before the window. */
  startIdx: number;
  /** Number of columns the bar spans. Always ≥ 1, capped at the
   *  remaining columns in the window. */
  span: number;
  /** True when the card's actual range extends past the window's
   *  left edge — used by the bar to render an open-left chevron. */
  clippedStart: boolean;
  /** True when the card's range extends past the window's right
   *  edge. Same — open-right chevron in the UI. */
  clippedEnd: boolean;
}

/**
 * Map a card's span onto the window's columns. Returns null if the
 * card has no dates or doesn't overlap the window at all. Single-
 * date cards (only start OR only due) collapse to a 1-column span
 * on whichever date is set — the timeline renders that as a narrow
 * marker rather than a full bar.
 */
export function cardSpanInWindow(
  card: { startDate: string | null; dueDate: string | null },
  win: TimelineWindow,
): CardSpan | null {
  const startKey = dueDateKey(card.startDate) ?? dueDateKey(card.dueDate);
  const endKey = dueDateKey(card.dueDate) ?? dueDateKey(card.startDate);
  if (!startKey || !endKey) return null;

  const winKeys = windowDays(win).map(localDateKey);
  const winStartKey = winKeys[0];
  const winEndKey = winKeys[winKeys.length - 1];

  if (endKey < winStartKey || startKey > winEndKey) return null;

  const clippedStart = startKey < winStartKey;
  const clippedEnd = endKey > winEndKey;

  const startIdx = clippedStart ? 0 : winKeys.indexOf(startKey);
  const endIdx = clippedEnd ? winKeys.length - 1 : winKeys.indexOf(endKey);
  return {
    startIdx,
    span: endIdx - startIdx + 1,
    clippedStart,
    clippedEnd,
  };
}

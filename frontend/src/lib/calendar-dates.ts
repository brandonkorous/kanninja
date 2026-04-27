/**
 * Date utilities for the Calendar view. Native Date arithmetic only
 * — no date-fns / dayjs dependency. Everything here works in the
 * user's local timezone (so "today" matches their wall clock) which
 * is what calendar UIs expect even though the API stores ISO UTC.
 */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Build the 6×7 grid for a month — always 42 cells starting on
 * Sunday so the grid never reflows when navigating between months.
 * Days outside the target month are returned too (greyed-out in the
 * UI) so the spillover at the start/end of the month is rendered.
 */
export function monthGridDays(month: Date): Date[] {
  const firstOfMonth = startOfMonth(month);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
  return days;
}

/**
 * Inclusive ISO range covering the entire month grid (including the
 * spillover days). Used as the `from`/`to` query params so cards
 * visible on the spillover are still fetched and rendered.
 *
 * Padded by a day on each side because dueDate is treated as a
 * date-only label by the calendar (see cardOverlapsDay): a card
 * dated `2026-04-27T00:00:00Z` belongs on the April 27 cell, but
 * the absolute timestamp is BEFORE midnight-local in any negative-
 * offset timezone. The padding ensures the filter doesn't drop
 * cards the calendar would otherwise display.
 */
export function monthGridRange(month: Date): { from: string; to: string } {
  const days = monthGridDays(month);
  return {
    from: startOfDay(addDays(days[0], -1)).toISOString(),
    to: endOfDay(addDays(days[days.length - 1], 1)).toISOString(),
  };
}

/**
 * The local YYYY-MM-DD string for a Date — what the user sees as
 * "the date" of the cell, regardless of timezone offsets.
 */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Does the card's span ([startDate, dueDate] with degenerate
 * fallback to whichever date is set) overlap the given day?
 *
 * Compared as date-only YYYY-MM-DD strings rather than absolute
 * timestamps. Date pickers serialize the picked date as UTC midnight
 * (`new Date('2026-04-27').toISOString()` → `2026-04-27T00:00:00Z`),
 * which is the previous day's evening in any negative-offset
 * timezone. Comparing as date-only keeps the card on the cell the
 * user picked it for, regardless of the viewer's timezone.
 */
export function cardOverlapsDay(
  card: { startDate: string | null; dueDate: string | null },
  day: Date,
): boolean {
  const start = card.startDate ?? card.dueDate;
  const end = card.dueDate ?? card.startDate;
  if (!start || !end) return false;
  const dayKey = localDateKey(day);
  const startKey = start.slice(0, 10);
  const endKey = end.slice(0, 10);
  return startKey <= dayKey && endKey >= dayKey;
}

/**
 * Compute the new start/due dates after dragging a card from one
 * day to another. Preserves the time-of-day component of each date
 * AND the span between them, so a 3-day kata stays a 3-day kata
 * after the drag. Cards with only one date update only that date.
 */
export function shiftCardDates(
  card: { startDate: string | null; dueDate: string | null },
  fromDay: Date,
  toDay: Date,
): { startDate?: string; dueDate?: string } {
  const deltaMs = startOfDay(toDay).getTime() - startOfDay(fromDay).getTime();
  const out: { startDate?: string; dueDate?: string } = {};
  if (card.startDate) {
    out.startDate = new Date(new Date(card.startDate).getTime() + deltaMs).toISOString();
  }
  if (card.dueDate) {
    out.dueDate = new Date(new Date(card.dueDate).getTime() + deltaMs).toISOString();
  }
  return out;
}

/**
 * Compute the new start/due dates after resizing a card from one of
 * its edges. Used by the timeline-bar edge handles.
 *
 * - Multi-day card (both dates): the dragged edge moves; the other
 *   edge stays put. Returns null if the new edge would invert the
 *   span (caller no-ops the mutation).
 * - Single-day card (only one date set): the dragged edge anchors
 *   the card into a span. Right-handle outward → set startDate to the
 *   current single-date and push dueDate by delta. Left-handle
 *   outward → set dueDate to the current single-date and pull
 *   startDate by delta. Inward (would shrink below a single day) is
 *   ignored.
 */
export function resizeCardDates(
  card: { startDate: string | null; dueDate: string | null },
  edge: 'start' | 'end',
  deltaDays: number,
): { startDate?: string; dueDate?: string } | null {
  if (deltaDays === 0) return null;
  const deltaMs = deltaDays * 24 * 60 * 60 * 1000;

  // Single-day card: only one date set, so resizing has to PROMOTE
  // the card into a span by adding the missing edge.
  const isSingle = !card.startDate !== !card.dueDate;
  if (isSingle) {
    const anchor = card.dueDate ?? card.startDate;
    if (!anchor) return null;
    if (edge === 'end' && deltaDays > 0) {
      const newDue = new Date(new Date(anchor).getTime() + deltaMs);
      return { startDate: anchor, dueDate: newDue.toISOString() };
    }
    if (edge === 'start' && deltaDays < 0) {
      const newStart = new Date(new Date(anchor).getTime() + deltaMs);
      return { startDate: newStart.toISOString(), dueDate: anchor };
    }
    return null;
  }

  if (edge === 'start') {
    const newStart = new Date(new Date(card.startDate!).getTime() + deltaMs);
    if (startOfDay(newStart).getTime() > startOfDay(new Date(card.dueDate!)).getTime()) {
      return null;
    }
    return { startDate: newStart.toISOString() };
  }

  const newDue = new Date(new Date(card.dueDate!).getTime() + deltaMs);
  if (startOfDay(newDue).getTime() < startOfDay(new Date(card.startDate!)).getTime()) {
    return null;
  }
  return { dueDate: newDue.toISOString() };
}

/**
 * Display + comparison helpers for `dueDate` (and `startDate`).
 *
 * The contract: dueDate is a date-only label, even though it's stored
 * as a `timestamp with time zone` ISO string. Date pickers serialize
 * the picked date as UTC midnight (`new Date('2026-04-27').toISOString()`
 * → `2026-04-27T00:00:00Z`), so the **UTC date portion** of the
 * stored ISO is what the user picked — not the local date you'd get
 * by feeding the timestamp through `new Date(...).toLocaleDateString()`.
 *
 * In any negative-offset timezone, that local conversion is off by
 * one day (April 27 UTC midnight = April 26 evening Pacific). All
 * surfaces that show or compare a dueDate should go through here.
 */

import { localDateKey } from './calendar-dates';

/** Returns "YYYY-MM-DD" — the date portion of the stored ISO. */
export function dueDateKey(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

/**
 * Format a stored dueDate ISO for display. Uses the user's locale
 * for the format pattern (so US users see "4/27/2026", Europeans see
 * "27/04/2026") but treats the date as a date-only label — never
 * shifts it by the user's UTC offset.
 *
 * Pass `format` for a more specific shape (e.g. `{ month: 'short',
 * day: 'numeric' }` → "Apr 27"). Falls back to `toLocaleDateString`
 * defaults if omitted.
 */
export function formatDueDate(
  iso: string | null | undefined,
  format?: Intl.DateTimeFormatOptions,
): string {
  const key = dueDateKey(iso);
  if (!key) return '';
  // Construct a local Date at noon on the picked day so locale
  // formatting renders that exact date. Noon avoids any DST/edge
  // issues that midnight could trigger near transition days.
  const [y, m, d] = key.split('-').map(Number);
  const local = new Date(y, m - 1, d, 12, 0, 0);
  return format
    ? local.toLocaleDateString(undefined, format)
    : local.toLocaleDateString();
}

/**
 * True when the dueDate is strictly before today (user's local
 * calendar). Compares date-only keys so a card "due today" is never
 * marked overdue, regardless of the time component or the user's
 * UTC offset.
 */
export function isOverdueDate(iso: string | null | undefined): boolean {
  const key = dueDateKey(iso);
  if (!key) return false;
  return key < localDateKey(new Date());
}

/**
 * True when the dueDate is today on the user's local calendar.
 * Convenience for surfaces that highlight today's work.
 */
export function isDueToday(iso: string | null | undefined): boolean {
  const key = dueDateKey(iso);
  if (!key) return false;
  return key === localDateKey(new Date());
}

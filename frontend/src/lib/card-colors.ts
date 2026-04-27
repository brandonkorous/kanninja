/**
 * Card color helpers for the Calendar / Timeline / List views.
 *
 * Priority is the primary visual signal everywhere — same colors as
 * the kanban card meta row (KanbanCardPreview) so a card looks the
 * same on every surface. The full set (border / background / text)
 * lets each view pick the treatment that suits its density: calendar
 * pills use background + text, timeline bars use background + border,
 * list rows use a left accent border.
 *
 * Dojo color is a SECONDARY signal that only appears in clan-level
 * views, where multiple dojos share the canvas and a thin left stripe
 * helps disambiguate at a glance. In dojo views it would be redundant
 * noise — every card is from the same dojo — so views must opt in.
 */

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface PriorityColor {
  /** Subtle tinted background — calendar pills, timeline bar fills. */
  bg: string;
  /** Saturated border — timeline bar outlines, list-row left accents. */
  border: string;
  /** Foreground text — meta rows, eyebrows. */
  text: string;
}

const PRIORITY_COLORS: Record<Priority, PriorityColor> = {
  urgent: { bg: 'bg-error/15', border: 'border-error', text: 'text-error' },
  high: { bg: 'bg-warning/15', border: 'border-warning', text: 'text-warning' },
  medium: { bg: 'bg-info/15', border: 'border-info', text: 'text-info' },
  low: { bg: 'bg-base-300/60', border: 'border-base-content/20', text: 'text-base-content/60' },
  none: { bg: 'bg-base-200', border: 'border-base-300', text: 'text-base-content/50' },
};

export function priorityColor(priority: string): PriorityColor {
  return PRIORITY_COLORS[(priority as Priority) ?? 'none'] ?? PRIORITY_COLORS.none;
}

/**
 * Curated dojo palette. Slug → Tailwind classes for the left-stripe
 * accent (used on clan-level views) and a matching swatch for the
 * picker UI. The slug list mirrors `DOJO_COLOR_IDS` from shared so
 * any value the API accepts has an entry here.
 */
export const DOJO_PALETTE: Record<
  string,
  { label: string; stripe: string; swatch: string }
> = {
  rose: { label: 'Rose', stripe: 'border-l-rose-400', swatch: 'bg-rose-400' },
  amber: { label: 'Amber', stripe: 'border-l-amber-400', swatch: 'bg-amber-400' },
  emerald: { label: 'Emerald', stripe: 'border-l-emerald-400', swatch: 'bg-emerald-400' },
  sky: { label: 'Sky', stripe: 'border-l-sky-400', swatch: 'bg-sky-400' },
  violet: { label: 'Violet', stripe: 'border-l-violet-400', swatch: 'bg-violet-400' },
  pink: { label: 'Pink', stripe: 'border-l-pink-400', swatch: 'bg-pink-400' },
  teal: { label: 'Teal', stripe: 'border-l-teal-400', swatch: 'bg-teal-400' },
  orange: { label: 'Orange', stripe: 'border-l-orange-400', swatch: 'bg-orange-400' },
};

const PALETTE_KEYS = Object.keys(DOJO_PALETTE);

/**
 * Stable left-stripe class for a dojo. Prefers the explicitly-picked
 * `color` slug (set on `boards.color`); falls back to a hash-of-id
 * pick when the dojo owner hasn't chosen one. So clan views always
 * have a stable, intentional-looking accent — even for brand-new
 * dojos that haven't been styled yet.
 */
export function dojoColorClass(boardId: string, color?: string | null): string {
  if (color && DOJO_PALETTE[color]) return DOJO_PALETTE[color].stripe;
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = (hash * 31 + boardId.charCodeAt(i)) | 0;
  }
  return DOJO_PALETTE[PALETTE_KEYS[Math.abs(hash) % PALETTE_KEYS.length]].stripe;
}

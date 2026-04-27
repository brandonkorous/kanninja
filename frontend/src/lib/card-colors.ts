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
 * Stable color from a board id — used as the "dojo color" left stripe
 * on cards in clan-level views until boards.color (Phase 7 schema
 * change) lands. Hashes the id into one of a curated palette so the
 * choice looks intentional rather than randomly hex-picked.
 *
 * Once boards.color exists, swap the implementation to read it and
 * fall back to this hash for boards that haven't set one. Public
 * signature stays the same.
 */
const DOJO_PALETTE = [
  'border-l-rose-400',
  'border-l-amber-400',
  'border-l-emerald-400',
  'border-l-sky-400',
  'border-l-violet-400',
  'border-l-pink-400',
  'border-l-teal-400',
  'border-l-orange-400',
];

export function dojoColorClass(boardId: string): string {
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = (hash * 31 + boardId.charCodeAt(i)) | 0;
  }
  return DOJO_PALETTE[Math.abs(hash) % DOJO_PALETTE.length];
}

import type { ScheduledCard } from '@/hooks/use-scheduled-cards';

/**
 * Filter shape for the calendar/timeline/list views. A null/empty
 * value means "no constraint on this axis" so the empty filter
 * (`emptyFilters`) returns every card.
 */
export interface CardFilters {
  /** null means "any priority". Otherwise card.priority must equal it. */
  priority: string | null;
  /** null means "any assignee". 'unassigned' means card.assigneeId === null.
   *  Otherwise card.assigneeId must equal it. */
  assigneeId: string | null;
  /** null means "any label". Otherwise card.labelIds must include it. */
  labelId: string | null;
  /** When true, completed cards are hidden. Default true so the
   *  default view focuses on what's still in flight. */
  hideCompleted: boolean;
}

export const emptyFilters: CardFilters = {
  priority: null,
  assigneeId: null,
  labelId: null,
  hideCompleted: true,
};

/** True when at least one filter is constraining results. Used to
 *  show the "Clear filters" affordance and a small dot on the bar. */
export function isFiltering(f: CardFilters): boolean {
  return (
    f.priority !== null ||
    f.assigneeId !== null ||
    f.labelId !== null ||
    !f.hideCompleted /* the *non-default* state is "show completed" */
  );
}

export function applyFilters(cards: ScheduledCard[], f: CardFilters): ScheduledCard[] {
  return cards.filter((card) => {
    if (f.hideCompleted && card.isCompleted) return false;
    if (f.priority !== null && card.priority !== f.priority) return false;
    if (f.assigneeId !== null) {
      if (f.assigneeId === 'unassigned') {
        if (card.assigneeId !== null) return false;
      } else if (card.assigneeId !== f.assigneeId) {
        return false;
      }
    }
    if (f.labelId !== null && !card.labelIds.includes(f.labelId)) return false;
    return true;
  });
}

'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faInbox,
} from '@fortawesome/free-solid-svg-icons';

interface CalendarHeaderProps {
  month: Date;
  unscheduledCount: number;
  isSidebarOpen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onToggleSidebar: () => void;
}

const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

/**
 * Calendar nav strip — month label, prev/next, Today shortcut, and
 * the unscheduled-cards drawer toggle. Lives above the grid so the
 * grid can stay focused on rendering days.
 */
export function CalendarHeader({
  month,
  unscheduledCount,
  isSidebarOpen,
  onPrev,
  onNext,
  onToday,
  onToggleSidebar,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 px-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous month"
          className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
          onClick={onPrev}
        >
          <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
        </button>
        <h2 className="font-display text-xl font-medium tracking-tight min-w-[10rem]">
          {month.toLocaleDateString(undefined, MONTH_FORMAT)}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
          onClick={onNext}
        >
          <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm ml-2 text-base-content/70"
          onClick={onToday}
        >
          Today
        </button>
      </div>

      <button
        type="button"
        aria-pressed={isSidebarOpen}
        className={`btn btn-sm ${isSidebarOpen ? 'btn-secondary' : 'btn-ghost'}`}
        onClick={onToggleSidebar}
      >
        <FontAwesomeIcon icon={faInbox} aria-hidden="true" />
        <span className="ml-2 hidden sm:inline">Unscheduled</span>
        {unscheduledCount > 0 && (
          <span className="ml-2 badge badge-sm badge-neutral">{unscheduledCount}</span>
        )}
      </button>
    </div>
  );
}

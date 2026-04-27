'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faInbox,
} from '@fortawesome/free-solid-svg-icons';
import type { TimelineZoom, TimelineWindow } from '@/lib/timeline-dates';
import { addDays } from '@/lib/calendar-dates';

interface TimelineHeaderProps {
  win: TimelineWindow;
  zoom: TimelineZoom;
  unscheduledCount: number;
  isSidebarOpen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onZoomChange: (zoom: TimelineZoom) => void;
  onToggleSidebar: () => void;
}

const WINDOW_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

/**
 * Timeline nav strip. Shows the current visible date range, prev/
 * next/today shortcuts, the week/month zoom toggle, and the
 * unscheduled-cards drawer button.
 */
export function TimelineHeader({
  win,
  zoom,
  unscheduledCount,
  isSidebarOpen,
  onPrev,
  onNext,
  onToday,
  onZoomChange,
  onToggleSidebar,
}: TimelineHeaderProps) {
  const last = addDays(win.start, win.days - 1);
  const rangeLabel = `${win.start.toLocaleDateString(undefined, WINDOW_FORMAT)} – ${last.toLocaleDateString(undefined, WINDOW_FORMAT)}`;

  return (
    <div className="flex items-center justify-between gap-4 mb-4 px-1">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Previous window"
          className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
          onClick={onPrev}
        >
          <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
        </button>
        <h2 className="font-display text-lg font-medium tracking-tight whitespace-nowrap">
          {rangeLabel}
        </h2>
        <button
          type="button"
          aria-label="Next window"
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

      <div className="flex items-center gap-3">
        <div role="group" aria-label="Zoom level" className="join">
          <button
            type="button"
            aria-pressed={zoom === 'week'}
            className={`btn btn-sm join-item ${zoom === 'week' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => onZoomChange('week')}
          >
            Week
          </button>
          <button
            type="button"
            aria-pressed={zoom === 'month'}
            className={`btn btn-sm join-item ${zoom === 'month' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => onZoomChange('month')}
          >
            Month
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
    </div>
  );
}

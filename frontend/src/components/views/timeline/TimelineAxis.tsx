'use client';

import { isSameDay } from '@/lib/calendar-dates';

interface TimelineAxisProps {
  days: Date[];
  /** Width of the lane-label gutter on the left so the day columns
   *  align with the rows below. Passed in rather than hardcoded so a
   *  parent can switch density (e.g. compact mode) by changing one
   *  number. */
  laneGutterWidth: string;
}

const TODAY = new Date();

const WEEKDAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short' };

/**
 * Sticky day-by-day axis above the timeline rows. Today is rendered
 * with a vermillion stamp on the date number to mirror the calendar
 * view's "you are here" treatment. Weekend columns are tinted to
 * help the eye scan the work week.
 */
export function TimelineAxis({ days, laneGutterWidth }: TimelineAxisProps) {
  return (
    <div
      className="grid border-b border-base-300 bg-base-200/60 sticky top-0 z-10"
      style={{
        gridTemplateColumns: `${laneGutterWidth} repeat(${days.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="px-3 py-2 border-r border-base-300 text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
        Lane
      </div>
      {days.map((day) => {
        const isToday = isSameDay(day, TODAY);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        return (
          <div
            key={day.toISOString()}
            className={`px-1 py-2 border-r border-base-300 text-center ${
              isWeekend ? 'bg-base-200/80' : ''
            }`}
          >
            <div className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
              {day.toLocaleDateString(undefined, WEEKDAY_FORMAT)}
            </div>
            <div
              className={
                isToday
                  ? 'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-content text-xs font-mono'
                  : 'mt-0.5 text-xs font-mono text-base-content/70'
              }
            >
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

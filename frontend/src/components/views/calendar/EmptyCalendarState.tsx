'use client';

import Link from 'next/link';

interface EmptyCalendarStateProps {
  /** Where the user should go to add their first kata. The dojo
   *  calendar links back to /board so the existing inline quick-add
   *  on the kanban column is the path. Clan calendar links to the
   *  user's dashboard since there's no implicit dojo to write to. */
  primaryHref: string;
  primaryLabel: string;
}

/**
 * Quiet banner above the grid when nothing is scheduled. Sits in the
 * normal layout flow so it doesn't cover the calendar — users can
 * still see the day grid (with today's stamp) and drag onto cells
 * once they have unscheduled cards. Subtle CTA points back to wherever
 * adding a kata makes sense for the surface (the board for dojo
 * views, the clan home for clan views).
 */
export function EmptyCalendarState({ primaryHref, primaryLabel }: EmptyCalendarStateProps) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-lg shadow-e1 px-6 py-5 mb-3 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
          Quiet
        </p>
        <h3 className="mt-1.5 font-display text-lg font-medium tracking-tight">
          Nothing scheduled <span className="italic text-primary">yet.</span>
        </h3>
        <p className="mt-1 text-sm text-base-content/60">
          Add a kata with a due date and it&rsquo;ll land on the right day.
        </p>
      </div>
      <Link href={primaryHref} className="btn btn-secondary btn-sm shrink-0">
        {primaryLabel}
      </Link>
    </div>
  );
}

'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ListGroupHeaderProps {
  icon: IconDefinition;
  label: string;
  count: number;
  /** Optional accent color class for the icon — used to make Overdue
   *  read as urgent without leaning on raw red text everywhere. */
  iconClassName?: string;
}

/**
 * Eyebrow-style section header for the List view. Mono caps + count
 * matches the rest of Hanko's section labels (e.g. clan members
 * page). Kept in its own file so both ListSection and the empty-day
 * skeletons can render identical headers.
 */
export function ListGroupHeader({ icon, label, count, iconClassName }: ListGroupHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h3 className="flex items-center gap-2 text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
        <FontAwesomeIcon
          icon={icon}
          aria-hidden="true"
          className={iconClassName ?? 'text-base-content/40'}
        />
        {label}
      </h3>
      <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
        {count}
      </span>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTableColumns,
  faCalendar,
  faChartGantt,
  faList,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ViewTab {
  /** URL-segment identifier (board / calendar / timeline / list). */
  id: string;
  label: string;
  icon: IconDefinition;
}

const DOJO_TABS: ViewTab[] = [
  { id: 'board', label: 'Board', icon: faTableColumns },
  { id: 'calendar', label: 'Calendar', icon: faCalendar },
  { id: 'timeline', label: 'Timeline', icon: faChartGantt },
  { id: 'list', label: 'List', icon: faList },
];

const CLAN_TABS: ViewTab[] = [
  { id: 'calendar', label: 'Calendar', icon: faCalendar },
  { id: 'timeline', label: 'Timeline', icon: faChartGantt },
  { id: 'list', label: 'List', icon: faList },
];

interface ViewSwitcherProps {
  /** URL prefix that comes before the view segment, e.g. `/dojo/abc`. */
  basePath: string;
  /** Which tab set to render — dojos have Board, clans don't. */
  scope: 'dojo' | 'clan';
}

/**
 * Tab strip used by the dojo and clan view layouts. Pure navigation
 * — clicking a tab is a Next link, never a state mutation. Active
 * state is derived from the pathname so deep-linked URLs always
 * render the right tab as selected without extra plumbing.
 *
 * Mobile-first sizing: icons always visible, label hidden under
 * sm: so the strip fits on a phone.
 */
export function ViewSwitcher({ basePath, scope }: ViewSwitcherProps) {
  const pathname = usePathname();
  const tabs = scope === 'dojo' ? DOJO_TABS : CLAN_TABS;

  return (
    <nav
      role="tablist"
      aria-label="Switch view"
      className="flex items-center gap-1 border-b border-base-300"
    >
      {tabs.map((tab) => {
        const href = `${basePath}/${tab.id}`;
        const isActive = pathname?.startsWith(href);
        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:shadow-focus rounded-t-md ${
              isActive
                ? 'border-primary text-base-content'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:border-base-content/20'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

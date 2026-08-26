import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGauge,
  faUsersRectangle,
  faTerminal,
  faFileLines,
  faChartLine,
  faPlug,
  faGear,
} from '@fortawesome/free-solid-svg-icons';

export type NavItem = { href: string; label: string; icon: IconDefinition };
export type NavGroup = { eyebrow: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    eyebrow: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: faGauge },
      { href: '/clans', label: 'Clans', icon: faUsersRectangle },
    ],
  },
  {
    eyebrow: 'Practice',
    items: [
      { href: '/agents', label: 'Agents', icon: faTerminal },
      { href: '/templates', label: 'Templates', icon: faFileLines },
    ],
  },
  {
    eyebrow: 'Review',
    items: [
      { href: '/analytics', label: 'Analytics', icon: faChartLine },
      { href: '/integrations', label: 'Integrations', icon: faPlug },
      { href: '/settings', label: 'Settings', icon: faGear },
    ],
  },
];

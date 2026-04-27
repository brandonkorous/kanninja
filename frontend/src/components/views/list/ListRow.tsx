'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faClock,
  faFire,
  faArrowUp,
  faMinus,
  faAngleDown,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { dojoColorClass, priorityColor } from '@/lib/card-colors';
import { formatDueDate, isOverdueDate } from '@/lib/due-dates';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';
import type { BoardMember } from '@/hooks/use-board-members';

const PRIORITY_ICONS: Record<string, IconDefinition> = {
  urgent: faFire,
  high: faArrowUp,
  medium: faMinus,
  low: faAngleDown,
};

interface ListRowProps {
  card: ScheduledCard;
  /** True when displayed in date-grouped mode — show the list name as
   *  a small mono badge so users know which lane the card lives in.
   *  In list-grouped mode the section header already says it. */
  showListName: boolean;
  member?: BoardMember;
  onClick: () => void;
  /** When set, swaps the priority left-stripe for a dojo-color stripe
   *  and adds the dojo title to the meta row. Clan-level views pass
   *  this so users can tell at a glance which dojo each kata is from
   *  when the canvas spans many. Dojo-level views omit it. */
  dojoAccent?: boolean;
}

/**
 * One card in the List view. Compact, single-row, scannable — built
 * for mobile-first density. Left accent border encodes priority,
 * title takes the bulk of the width, meta (priority pill, due date,
 * assignee) flows to the right and collapses on narrow viewports.
 */
export function ListRow({ card, showListName, member, onClick, dojoAccent }: ListRowProps) {
  const colors = priorityColor(card.priority);
  const overdue = !card.isCompleted && isOverdueDate(card.dueDate);
  // Clan views replace the priority stripe with a dojo stripe so the
  // canvas reads as "which dojo, then which priority" — the row's
  // priority pill on the right keeps that signal alive.
  const stripeClass = dojoAccent
    ? dojoColorClass(card.boardId, card.boardColor)
    : colors.border;
  const subLabel = dojoAccent ? card.boardTitle : showListName ? card.listTitle : null;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open kata: ${card.title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group flex items-center gap-4 bg-base-100 border border-base-300 border-l-4 ${stripeClass} rounded-lg px-4 py-3 cursor-pointer transition-all hover:shadow-e2 hover:-translate-y-px focus-visible:shadow-focus focus-visible:outline-none`}
    >
      <div className="min-w-0 flex-1">
        <h4
          className={`font-display text-base font-semibold leading-snug truncate ${
            card.isCompleted ? 'line-through text-base-content/50' : ''
          }`}
        >
          {card.title}
        </h4>
        {subLabel && (
          <p className="mt-1 text-eyebrow font-mono uppercase tracking-widest text-base-content/40 truncate">
            {subLabel}
          </p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-4 shrink-0 font-mono text-eyebrow uppercase tracking-wider">
        {card.priority !== 'none' && (
          <span className={`flex items-center gap-1.5 ${colors.text}`}>
            <FontAwesomeIcon icon={PRIORITY_ICONS[card.priority]} aria-hidden="true" />
            <span className="hidden md:inline">{card.priority}</span>
          </span>
        )}
        {card.dueDate && (
          <span
            className={`flex items-center gap-1.5 ${overdue ? 'text-error' : 'text-base-content/60'}`}
          >
            <FontAwesomeIcon icon={faClock} aria-hidden="true" />
            {formatDueDate(card.dueDate, { month: 'short', day: 'numeric' })}
          </span>
        )}
        {card.isCompleted && (
          <span className="flex items-center gap-1.5 text-success">
            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            <span className="hidden md:inline">sealed</span>
          </span>
        )}
      </div>

      <span
        className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center shrink-0 overflow-hidden"
        title={member?.displayName ?? undefined}
      >
        {member?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <FontAwesomeIcon
            icon={faUser}
            className="text-[11px] text-base-content/40"
            aria-hidden="true"
          />
        )}
      </span>
    </article>
  );
}

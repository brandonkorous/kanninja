'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { CardFilters } from '@/lib/card-filters';
import { emptyFilters, isFiltering } from '@/lib/card-filters';
import type { BoardMember } from '@/hooks/use-board-members';

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface FilterBarProps {
  filters: CardFilters;
  onChange: (filters: CardFilters) => void;
  /** Optional — when omitted, the assignee filter is hidden. Clan
   *  views skip it because they don't fetch members across dojos. */
  members?: BoardMember[];
  /** Optional — when omitted, the label filter is hidden. Same
   *  rationale for clan views. */
  labels?: LabelOption[];
}

const PRIORITY_OPTIONS = ['none', 'low', 'medium', 'high', 'urgent'] as const;

/**
 * Compact filter strip rendered above the view content. Single-
 * select per axis (multi-select can come later if users ask for it
 * — single covers most "I want to see X" cases). The "Clear" affordance
 * only renders when at least one filter is active so the bar stays
 * quiet when filters are at their defaults.
 *
 * Members and labels are optional props so clan views — which don't
 * have a clan-wide member/label fetch yet — can render a reduced
 * bar with just priority + hide-sealed.
 */
export function FilterBar({ filters, onChange, members, labels }: FilterBarProps) {
  const active = isFiltering(filters);
  const update = <K extends keyof CardFilters>(key: K, value: CardFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 py-2 border-b border-base-300">
      <span className="inline-flex items-center gap-1.5 text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mr-1">
        <FontAwesomeIcon icon={faFilter} aria-hidden="true" />
        Filter
      </span>

      <select
        aria-label="Filter by priority"
        className="select select-sm select-bordered"
        value={filters.priority ?? ''}
        onChange={(e) => update('priority', e.target.value || null)}
      >
        <option value="">Any priority</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>

      {members && (
        <select
          aria-label="Filter by assignee"
          className="select select-sm select-bordered"
          value={filters.assigneeId ?? ''}
          onChange={(e) => update('assigneeId', e.target.value || null)}
        >
          <option value="">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName ?? m.email}
            </option>
          ))}
        </select>
      )}

      {labels && labels.length > 0 && (
        <select
          aria-label="Filter by label"
          className="select select-sm select-bordered"
          value={filters.labelId ?? ''}
          onChange={(e) => update('labelId', e.target.value || null)}
        >
          <option value="">Any label</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}

      <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-base-content/70 ml-1">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={filters.hideCompleted}
          onChange={(e) => update('hideCompleted', e.target.checked)}
        />
        Hide sealed
      </label>

      {active && (
        <button
          type="button"
          onClick={() => onChange(emptyFilters)}
          className="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content ml-auto"
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" className="mr-1" />
          Clear
        </button>
      )}
    </div>
  );
}

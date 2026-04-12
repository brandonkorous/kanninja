'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

type Size = 'lg' | 'md';

interface Props {
  value: string;
  canEdit: boolean;
  // Ephemeral label used in the aria-label ("Edit dojo title: Ship v2").
  // Also used to build the save-button aria-label.
  entityLabel: string;
  // 'lg' (default) is the marketing-style page heading: text-3xl md:text-4xl
  // with a top margin baked in. 'md' is the workspace-tool variant: text-2xl,
  // no margin, designed to sit inline next to a back button + meta row in a
  // single horizontal header. Pick md for tool surfaces (kanban, kata page),
  // lg for entity detail pages (clan, profile).
  size?: Size;
  onSave: (next: string) => unknown;
}

const SIZE: Record<Size, { wrapper: string; text: string }> = {
  lg: { wrapper: 'mt-4', text: 'text-3xl md:text-4xl' },
  md: { wrapper: '', text: 'text-2xl' },
};

// Display-size inline-editable title for page-level headings.
// Implements the canonical inline-edit pattern from
// .claude/skills/hanko/editing-patterns.md — click-to-edit, pen icon
// affordance, blur/Enter commit, Escape cancel, explicit check button
// for the mobile touch path, and a role-gated read-only fallback.
//
// Fires onSave only if the trimmed value is both non-empty and changed.
// The parent owns the mutation + toast.
export function InlineEditTitle({
  value,
  canEdit,
  entityLabel,
  size = 'lg',
  onSave,
}: Props) {
  const { wrapper, text } = SIZE[size];
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      await onSave(trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${wrapper}`}>
        <input
          className={`input input-bordered w-full max-w-2xl font-display ${text} font-medium tracking-tight focus:shadow-focus`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          autoFocus
        />
        <button
          type="button"
          aria-label={`Save ${entityLabel}`}
          className="btn btn-ghost btn-square shrink-0"
          // Prevents the input from losing focus before the click fires,
          // which would otherwise trigger handleSave twice (once on blur,
          // once on click).
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
        >
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <h1 className={`${wrapper} font-display ${text} font-medium tracking-tight truncate`}>
        {value}
      </h1>
    );
  }

  return (
    <h1
      role="button"
      tabIndex={0}
      aria-label={`Edit ${entityLabel}: ${value}`}
      className={`group ${wrapper} font-display ${text} font-medium tracking-tight cursor-pointer transition-colors focus-visible:shadow-focus focus-visible:outline-none rounded-md truncate`}
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setDraft(value);
          setIsEditing(true);
        }
      }}
    >
      {value}
      <FontAwesomeIcon
        icon={faPen}
        aria-hidden="true"
        className="text-sm ml-3 text-base-content/20 group-hover:text-primary transition-colors"
      />
    </h1>
  );
}

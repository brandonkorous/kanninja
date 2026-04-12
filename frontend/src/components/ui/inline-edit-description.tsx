'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Props {
  // Current description from the server. Empty string and null are
  // both treated as "no description yet".
  value: string | null;
  canEdit: boolean;
  placeholder?: string;
  emptyLabel?: string;
  // Called with the new trimmed value, or null if the user cleared it.
  // Only fires when the value actually changed.
  onSave: (next: string | null) => unknown;
}

// Multi-line inline-editable description for page-level subheadings.
// Same interaction contract as InlineEditTitle but uses a textarea:
// Enter inserts a newline (standard textarea behavior), blur or the
// explicit check button commits, Escape cancels. When the value is
// empty and the user can edit, shows a placeholder button so the
// affordance still exists at rest.
export function InlineEditDescription({
  value,
  canEdit,
  placeholder = 'Add a description',
  emptyLabel = 'Add a description',
  onSave,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = async () => {
    const trimmed = draft.trim();
    const current = value ?? '';
    if (trimmed !== current) {
      await onSave(trimmed || null);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 mt-3 max-w-2xl">
        <textarea
          className="textarea textarea-bordered w-full text-base focus:shadow-focus"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsEditing(false);
          }}
          placeholder={placeholder}
          autoFocus
        />
        <button
          type="button"
          aria-label="Save description"
          className="btn btn-ghost btn-square shrink-0"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
        >
          <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (value) {
    if (!canEdit) {
      return (
        <p className="mt-3 text-base text-base-content/70 max-w-2xl">{value}</p>
      );
    }
    return (
      <p
        role="button"
        tabIndex={0}
        aria-label="Edit description"
        className="group mt-3 text-base text-base-content/70 max-w-2xl cursor-pointer focus-visible:shadow-focus focus-visible:outline-none rounded-sm"
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
          className="text-xs ml-2 text-base-content/20 group-hover:text-primary transition-colors"
        />
      </p>
    );
  }

  if (!canEdit) return null;

  return (
    <button
      type="button"
      className="group mt-3 text-base text-base-content/40 italic hover:text-base-content/70 focus-visible:shadow-focus focus-visible:outline-none rounded-sm transition-colors"
      onClick={() => {
        setDraft('');
        setIsEditing(true);
      }}
    >
      {emptyLabel}
      <FontAwesomeIcon
        icon={faPen}
        aria-hidden="true"
        className="text-xs ml-2 text-base-content/20 group-hover:text-primary transition-colors"
      />
    </button>
  );
}

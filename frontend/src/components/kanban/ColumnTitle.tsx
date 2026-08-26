'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Props {
  title: string;
  canEdit: boolean;
  allSealed: boolean;
  cardsCount: number;
  onSave: (title: string) => void | Promise<unknown>;
}

/**
 * The column's title, badge, and inline-edit affordance per Hanko
 * editing-patterns.md. Split out of KanbanColumnHeader so that file has
 * room for the reorder controls and stays under the 200-line cap.
 */
export function ColumnTitle({ title, canEdit, allSealed, cardsCount, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = async () => {
    if (draft.trim() && draft !== title) await onSave(draft.trim());
    setIsEditing(false);
  };

  const badge = (
    <span
      className={`badge badge-sm ${allSealed ? 'badge-primary' : 'badge-ghost'}`}
      aria-label={allSealed ? `${cardsCount} sealed` : undefined}
    >
      {cardsCount}
    </span>
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1 mr-2">
        <input
          className="input input-sm input-bordered flex-1 text-eyebrow font-mono uppercase tracking-widest focus:shadow-focus"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(title);
              setIsEditing(false);
            }
          }}
          autoFocus
        />
        <button
          type="button"
          aria-label="Save list title"
          className="btn btn-ghost btn-sm btn-square shrink-0"
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
      <h3 className="text-eyebrow font-mono uppercase tracking-widest text-base-content/70 flex items-center gap-3 min-w-0">
        <span className="truncate">{title}</span>
        {badge}
      </h3>
    );
  }

  const startEditing = () => {
    setDraft(title);
    setIsEditing(true);
  };

  return (
    <h3
      role="button"
      tabIndex={0}
      aria-label={`Edit list title: ${title}`}
      className="group text-eyebrow font-mono uppercase tracking-widest text-base-content/70 flex items-center gap-3 min-w-0 cursor-pointer focus-visible:shadow-focus focus-visible:outline-none rounded-sm"
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditing();
        }
      }}
    >
      <span className="truncate">{title}</span>
      <FontAwesomeIcon
        icon={faPen}
        aria-hidden="true"
        className="text-xs text-base-content/20 group-hover:text-primary transition-colors shrink-0"
      />
      {badge}
    </h3>
  );
}

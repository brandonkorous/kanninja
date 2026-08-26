'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface Props {
  isAdding: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpen: () => void;
  onCancel: () => void;
}

/**
 * Trailing "add another list" lane. State lives in KanbanBoard because the
 * empty state also opens this form; this component is the presentation
 * half. Gated on canEdit by its caller, per editing-patterns.md.
 */
export function AddListControl({
  isAdding,
  title,
  onTitleChange,
  onSubmit,
  onOpen,
  onCancel,
}: Props) {
  return (
    <div className="w-72 shrink-0">
      {isAdding ? (
        <form onSubmit={onSubmit} className="bg-base-200 rounded-xl p-3 space-y-2">
          <input
            className="input input-sm input-bordered w-full"
            placeholder="List title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            autoFocus
          />
          <div className="flex gap-1">
            <button
              type="submit"
              className="btn btn-secondary btn-sm md:btn-xs"
              disabled={!title.trim()}
            >
              Add list
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm md:btn-xs"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="btn btn-ghost w-full justify-start text-base-content/70 border border-dashed border-base-300 hover:border-base-content/40 hover:bg-transparent"
          onClick={onOpen}
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" /> Add another list
        </button>
      )}
    </div>
  );
}

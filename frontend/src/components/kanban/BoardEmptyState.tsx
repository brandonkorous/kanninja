'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface Props {
  canEdit: boolean;
  onAddList: () => void;
}

/**
 * Empty dojo — the canonical Hanko empty-state pattern used on /dashboard
 * and /clans: card wrapper, ninja icon at top, text-3xl headline with a
 * single-word italic-vermillion stamp, body copy, primary CTA wrapped in
 * mt-10. For viewers (canEdit=false) the button is hidden and the copy
 * softens. Extracted from KanbanBoard to keep that file under 200 lines.
 */
export function BoardEmptyState({ canEdit, onAddList }: Props) {
  return (
    <div className="bg-base-100 rounded-lg shadow-e1 p-12 md:p-16 max-w-2xl flex flex-col items-start">
      <Image
        src="/brand/nin-icon.svg"
        alt=""
        width={80}
        height={80}
        className="h-20 w-20"
      />
      <h2 className="mt-10 font-display text-3xl font-medium tracking-tight">
        {canEdit ? (
          <>
            A new dojo. <span className="italic text-primary">Begin.</span>
          </>
        ) : (
          <>
            Nothing here <span className="italic text-primary">yet.</span>
          </>
        )}
      </h2>
      <p className="mt-4 text-base text-base-content/70 max-w-md">
        {canEdit
          ? 'Lists hold the stances of your practice. Start with the ones you need — backlog, in progress, done. You can rename them later.'
          : 'This dojo has no lists yet. Check back once an owner adds one.'}
      </p>
      {canEdit && (
        <div className="mt-10">
          <button type="button" className="btn btn-primary" onClick={onAddList}>
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
            Add your first list
          </button>
        </div>
      )}
    </div>
  );
}

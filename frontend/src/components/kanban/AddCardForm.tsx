'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCreateCard } from '@/hooks/use-cards';

interface Props {
  listId: string;
  boardId: string;
}

/**
 * "Add a kata" affordance, pinned above the column's card list.
 *
 * It sits at the top because that is where the new kata appears — the
 * create call passes `position: 'top'` and the server resolves the head
 * index for the list. Extracted from KanbanColumn so that file stays
 * under the 200-line cap.
 */
export function AddCardForm({ listId, boardId }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const createCard = useCreateCard(boardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createCard.mutateAsync({ listId, title: title.trim(), position: 'top' });
    setTitle('');
    // Stay open so a burst of katas can be typed in one sitting; Escape
    // or a blur on an empty field closes it.
  };

  if (!isAdding) {
    return (
      <button
        className="btn btn-ghost btn-sm w-full justify-start text-base-content/70"
        onClick={() => setIsAdding(true)}
      >
        <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" /> Add a kata
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="input input-sm input-bordered w-full"
        placeholder="Kata title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setTitle('');
            setIsAdding(false);
          }
        }}
        onBlur={() => !title.trim() && setIsAdding(false)}
      />
      <div className="flex gap-1">
        <button
          type="submit"
          className="btn btn-secondary btn-sm md:btn-xs"
          disabled={!title.trim() || createCard.isPending}
        >
          Add
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm md:btn-xs"
          onClick={() => {
            setTitle('');
            setIsAdding(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

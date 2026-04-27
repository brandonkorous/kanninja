'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useCreateCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { ListGroupHeader } from './ListGroupHeader';
import { ListRow } from './ListRow';
import type { ScheduledCard } from '@/hooks/use-scheduled-cards';
import type { BoardMember } from '@/hooks/use-board-members';

interface ListSectionProps {
  boardId: string;
  icon: IconDefinition;
  iconClassName?: string;
  label: string;
  cards: ScheduledCard[];
  showListName: boolean;
  members: Map<string, BoardMember>;
  onCardClick: (cardId: string) => void;
  /** Pass a listId to enable inline quick-add into that list. Date-
   *  bucket sections omit this — adding a "today" card from a section
   *  has no implicit list to write to, so the user toggles to By List
   *  mode first. Keeps the quick-add unambiguous. */
  quickAddListId?: string;
  /** Optional default due date (ISO datetime) applied when quick-adding
   *  from a date bucket in list-grouped mode. */
  quickAddDueDate?: string;
  emptyMessage?: string;
  /** When true, ListRow swaps its priority left-stripe for a dojo-color
   *  stripe and shows the dojo title instead of the list title. Set by
   *  clan-level views; dojo views leave it false. */
  dojoAccent?: boolean;
}

/**
 * One section in the List view — header + cards + an optional inline
 * quick-add. Visually identical between date-grouped and list-grouped
 * modes; the only difference is whether quick-add is wired up.
 */
export function ListSection({
  boardId,
  icon,
  iconClassName,
  label,
  cards,
  showListName,
  members,
  onCardClick,
  quickAddListId,
  quickAddDueDate,
  emptyMessage,
  dojoAccent,
}: ListSectionProps) {
  const { canEdit } = useDojoPermissions(boardId);
  const createCard = useCreateCard(boardId);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !quickAddListId) return;
    await createCard.mutateAsync({
      listId: quickAddListId,
      title: title.trim(),
      ...(quickAddDueDate && { dueDate: quickAddDueDate }),
    });
    setTitle('');
    setIsAdding(false);
  };

  return (
    <section aria-label={label} className="space-y-2">
      <ListGroupHeader
        icon={icon}
        iconClassName={iconClassName}
        label={label}
        count={cards.length}
      />

      {cards.length === 0 && !isAdding && emptyMessage && (
        <p className="px-1 py-2 text-sm text-base-content/50 italic">{emptyMessage}</p>
      )}

      <div className="space-y-2">
        {cards.map((card) => (
          <ListRow
            key={card.id}
            card={card}
            showListName={showListName}
            member={card.assigneeId ? members.get(card.assigneeId) : undefined}
            onClick={() => onCardClick(card.id)}
            dojoAccent={dojoAccent}
          />
        ))}
      </div>

      {canEdit && quickAddListId && (
        <div className="px-1">
          {isAdding ? (
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                placeholder="Kata title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                onBlur={() => !title.trim() && setIsAdding(false)}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={!title.trim()}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              className="btn btn-ghost btn-sm w-full justify-start text-base-content/60 hover:text-base-content"
              onClick={() => setIsAdding(true)}
            >
              <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
              Add a kata
            </button>
          )}
        </div>
      )}
    </section>
  );
}

'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Select } from '@/components/ui';
import { useCreateCard } from '@/hooks/use-cards';
import { useClanBoards } from '@/hooks/use-clans';
import { useBoard } from '@/hooks/use-boards';

interface ClanQuickAddCardDialogProps {
  open: boolean;
  onClose: () => void;
  clanId: string;
  /** Pre-selected dojo. Clan timeline passes this (lane = dojo) so
   *  the user only picks a list. */
  defaultBoardId?: string;
  /** ISO datetime to pre-fill as dueDate on the new card. */
  defaultDueDate?: string;
  /** Optional pre-fill for start date. */
  defaultStartDate?: string;
}

/**
 * Clan-aware quick-add. Same shape as the dojo QuickAddCardDialog but
 * with a dojo picker stacked above the list picker — clan views can
 * span multiple boards, so neither the dojo nor the list is implicit.
 *
 * Filtering: only shows boards where the clan has owner/editor access
 * (viewer-only attachments can't write). Once a dojo is picked, the
 * list dropdown lazily fetches that board's lists via useBoard.
 */
export function ClanQuickAddCardDialog({
  open,
  onClose,
  clanId,
  defaultBoardId,
  defaultDueDate,
  defaultStartDate,
}: ClanQuickAddCardDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const { data: clanBoards } = useClanBoards(clanId);
  // Filter to boards the clan can write to. The user's role within
  // the clan still has to pass the per-board check server-side, so
  // this is just a UX filter to hide hopeless options.
  const writableBoards = useMemo(
    () => (clanBoards ?? []).filter((b) => b.clanRole !== 'viewer'),
    [clanBoards],
  );

  const [boardId, setBoardId] = useState<string>(defaultBoardId ?? '');
  const [listId, setListId] = useState<string>('');
  const [title, setTitle] = useState('');

  const { data: board } = useBoard(boardId);
  const lists = board?.lists ?? [];
  const createCard = useCreateCard(boardId);

  useEffect(() => {
    if (open) {
      setTitle('');
      setBoardId(defaultBoardId ?? writableBoards[0]?.id ?? '');
      setListId('');
    }
  }, [open, defaultBoardId, writableBoards]);

  // Default the list to the first one once the board's lists arrive.
  // Otherwise the picker would render with an empty selection until
  // the user touches it.
  useEffect(() => {
    if (open && lists.length && !listId) {
      setListId(lists[0].id);
    }
  }, [open, lists, listId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !boardId || !listId) return;
    await createCard.mutateAsync({
      listId,
      title: title.trim(),
      ...(defaultStartDate && { startDate: defaultStartDate }),
      ...(defaultDueDate && { dueDate: defaultDueDate }),
    });
    onClose();
  };

  const showBoardPicker = !defaultBoardId;
  const canSubmit = !!title.trim() && !!boardId && !!listId && !createCard.isPending;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
              New kata
            </p>
            <h3
              id={titleId}
              className="mt-2 font-display text-2xl font-medium tracking-tight"
            >
              Add a <span className="italic text-primary">kata.</span>
            </h3>
          </div>
          <button
            type="button"
            aria-label="Cancel quick add"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Title" htmlFor="clan-quickadd-title">
            <Input
              id="clan-quickadd-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Refactor the auth middleware"
            />
          </Field>

          {showBoardPicker && (
            <Field label="Dojo" htmlFor="clan-quickadd-board">
              <Select
                id="clan-quickadd-board"
                value={boardId}
                onChange={(e) => {
                  setBoardId(e.target.value);
                  setListId('');
                }}
              >
                {writableBoards.length === 0 && (
                  <option value="" disabled>
                    No editable dojos in this clan
                  </option>
                )}
                {writableBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="List" htmlFor="clan-quickadd-list">
            <Select
              id="clan-quickadd-list"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              disabled={!boardId || lists.length === 0}
            >
              {lists.length === 0 && (
                <option value="" disabled>
                  {boardId ? 'Loading lists…' : 'Pick a dojo first'}
                </option>
              )}
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {createCard.isPending ? 'Adding…' : 'Add kata'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close">close</button>
      </form>
    </dialog>
  );
}

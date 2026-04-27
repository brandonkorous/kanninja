'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Select } from '@/components/ui';
import { useCreateCard } from '@/hooks/use-cards';

interface ListOption {
  id: string;
  title: string;
}

interface QuickAddCardDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  /** Lists the user can pick from. When `defaultListId` is set the
   *  picker is hidden — the list is implicit. */
  lists: ListOption[];
  /** Pre-selected list id. Timeline uses this (lane = list); calendar
   *  + list-by-date leave it undefined so the user picks. */
  defaultListId?: string;
  /** ISO datetime to pre-fill as dueDate on the new card. */
  defaultDueDate?: string;
  /** Optional pre-fill for start date. */
  defaultStartDate?: string;
}

/**
 * The single quick-add surface for the calendar / timeline / list
 * views. Mirrors the kanban column's inline quick-add at heart —
 * title is the only required field — but adds an optional list
 * picker for surfaces where the list isn't implicit, and routes
 * `defaultDueDate` / `defaultStartDate` through to the API so the
 * new card lands where the user clicked.
 */
export function QuickAddCardDialog({
  open,
  onClose,
  boardId,
  lists,
  defaultListId,
  defaultDueDate,
  defaultStartDate,
}: QuickAddCardDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const createCard = useCreateCard(boardId);

  const [title, setTitle] = useState('');
  const [listId, setListId] = useState<string>(defaultListId ?? lists[0]?.id ?? '');

  useEffect(() => {
    if (open) {
      // Reset on each open so a closed-then-reopened dialog starts
      // fresh — otherwise the stale title from the last attempt would
      // be the first thing the user sees.
      setTitle('');
      setListId(defaultListId ?? lists[0]?.id ?? '');
    }
  }, [open, defaultListId, lists]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !listId) return;
    await createCard.mutateAsync({
      listId,
      title: title.trim(),
      ...(defaultStartDate && { startDate: defaultStartDate }),
      ...(defaultDueDate && { dueDate: defaultDueDate }),
    });
    onClose();
  };

  const showListPicker = !defaultListId;

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
          <Field label="Title" htmlFor="quickadd-title">
            <Input
              id="quickadd-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Refactor the auth middleware"
            />
          </Field>

          {showListPicker && (
            <Field label="List" htmlFor="quickadd-list">
              <Select
                id="quickadd-list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim() || !listId || createCard.isPending}
            >
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

'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useCreateBoard } from '@/hooks/use-boards';
import { useClans } from '@/hooks/use-clans';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Textarea, Select } from '@/components/ui';

// Special sentinel for the "no clan attached" option in the picker.
// Empty string is the safest sentinel for a <select> default — it can't
// collide with a UUID and serializes naturally as a missing form field.
const NO_CLAN = '';

// Uses the native <dialog> showModal() API so the browser provides focus
// trap, Escape-to-cancel, body scroll lock, top-layer rendering, and focus
// return to the trigger.
export function CreateBoardModal() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [clanId, setClanId] = useState<string>(NO_CLAN);
    const createBoard = useCreateBoard();
    const { data: clans } = useClans();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    // Only clans where the user can create things — admin or member.
    // Readers can see a clan's boards but can't add new ones to it,
    // so we hide them from the picker entirely. Sorted by the backend
    // (personal clan first, then by recency).
    const eligibleClans = useMemo(
        () => clans?.filter((c) => c.role === 'admin' || c.role === 'member') ?? [],
        [clans],
    );

    // Default the picker to the user's personal clan once it loads.
    useEffect(() => {
        if (clanId === NO_CLAN && eligibleClans.length > 0) {
            const personal = eligibleClans.find((c) => c.isPersonal);
            if (personal) setClanId(personal.id);
        }
    }, [eligibleClans, clanId]);

    // Sync React state with the native dialog state machine.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await createBoard.mutateAsync({
            title: title.trim(),
            description: description.trim() || undefined,
            clanId: clanId === NO_CLAN ? undefined : clanId,
        });
        setTitle('');
        setDescription('');
        // Don't reset clanId — keep the picker on whatever the user
        // chose so creating multiple boards in a row stays fast.
        setOpen(false);
    };

    const handleClose = () => {
        if (createBoard.isPending) return;
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-primary"
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
            >
                <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
                Open a dojo
            </button>

            <dialog
                ref={dialogRef}
                className="modal"
                aria-labelledby={titleId}
                onClose={() => setOpen(false)}
                onCancel={(e) => {
                    if (createBoard.isPending) e.preventDefault();
                }}
            >
                <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        New dojo
                    </p>
                    <h3
                        id={titleId}
                        className="mt-4 font-display text-3xl font-medium tracking-tight"
                    >
                        Open a new <span className="italic text-primary">dojo.</span>
                    </h3>
                    <p className="mt-3 text-sm text-base-content/70">
                        Pick a clan, give it a name. You can change either later.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <Field label="Clan" htmlFor="board-clan">
                            <Select
                                id="board-clan"
                                value={clanId}
                                onChange={(e) => setClanId(e.target.value)}
                            >
                                <option value={NO_CLAN}>Personal — only you</option>
                                {eligibleClans.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                        {c.isPersonal ? ' (personal)' : ''}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Name" htmlFor="board-title">
                            <Input
                                id="board-title"
                                type="text"
                                placeholder="The Hanko kata"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                required
                                maxLength={100}
                            />
                        </Field>
                        <Field label="Description" htmlFor="board-description" optional>
                            <Textarea
                                id="board-description"
                                placeholder="What is this dojo for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                maxLength={500}
                            />
                        </Field>
                        <div className="flex items-center justify-end gap-4 pt-2">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={createBoard.isPending || !title.trim()}
                            >
                                {createBoard.isPending ? 'Opening…' : 'Open dojo'}
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button type="submit" aria-label="Close">
                        close
                    </button>
                </form>
            </dialog>
        </>
    );
}

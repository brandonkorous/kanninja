'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useCreateClan } from '@/hooks/use-clans';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Textarea } from '@/components/ui';

// Uses the native <dialog> showModal() API so the browser provides focus
// trap, Escape-to-cancel, body scroll lock, top-layer rendering, and focus
// return to the trigger.
export function CreateClanModal() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const createClan = useCreateClan();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

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
        if (!name.trim()) return;
        await createClan.mutateAsync({
            name: name.trim(),
            description: description.trim() || undefined,
        });
        setName('');
        setDescription('');
        setOpen(false);
    };

    const handleClose = () => {
        if (createClan.isPending) return;
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
                Start a clan
            </button>

            <dialog
                ref={dialogRef}
                className="modal"
                aria-labelledby={titleId}
                onClose={() => setOpen(false)}
                onCancel={(e) => {
                    if (createClan.isPending) e.preventDefault();
                }}
            >
                <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        New clan
                    </p>
                    <h3
                        id={titleId}
                        className="mt-4 font-display text-3xl font-medium tracking-tight"
                    >
                        Start a new <span className="italic text-primary">clan.</span>
                    </h3>
                    <p className="mt-3 text-sm text-base-content/70">
                        Give it a name. Invite members later.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <Field label="Name" htmlFor="clan-name">
                            <Input
                                id="clan-name"
                                type="text"
                                placeholder="The Hanko Clan"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                                maxLength={100}
                            />
                        </Field>
                        <Field label="Description" htmlFor="clan-description" optional>
                            <Textarea
                                id="clan-description"
                                placeholder="What is this clan for?"
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
                                disabled={createClan.isPending || !name.trim()}
                            >
                                {createClan.isPending ? 'Starting…' : 'Start clan'}
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button
                        type="submit"
                        aria-label="Close"
                        disabled={createClan.isPending}
                    >
                        close
                    </button>
                </form>
            </dialog>
        </>
    );
}

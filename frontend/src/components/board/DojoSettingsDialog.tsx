'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateBoard, useDeleteBoard } from '@/hooks/use-boards';
import { Field, Textarea, ConfirmDialog } from '@/components/ui';
import { DojoAccessSection } from './DojoAccessSection';

interface DojoSettingsDialogProps {
    boardId: string;
    boardTitle: string;
    boardDescription: string | null;
    /** True only if the viewer is the board's creator. Gates the
     *  Danger section (delete) and the Access section's manage
     *  controls (attach/detach/role). Description editing is gated
     *  on currentUserRole === 'editor' or higher, which the parent
     *  has already verified by mounting this dialog. */
    isCreator: boolean;
    open: boolean;
    onClose: () => void;
}

// The single secondary surface for a dojo. Sits behind a small gear
// icon in the page header so the kanban gets the full canvas. Three
// sections — details, access, danger — each visible based on the
// viewer's role. Aim is to be useful when needed and invisible
// otherwise.
export function DojoSettingsDialog({
    boardId,
    boardTitle,
    boardDescription,
    isCreator,
    open,
    onClose,
}: DojoSettingsDialogProps) {
    const router = useRouter();
    const updateBoard = useUpdateBoard(boardId);
    const deleteBoard = useDeleteBoard();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    // Local draft state for description so the user can edit, see the
    // dirty marker, and explicitly save. We sync from props whenever
    // the dialog (re)opens so it always shows the latest server value.
    const [description, setDescription] = useState(boardDescription ?? '');
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (open) setDescription(boardDescription ?? '');
    }, [open, boardDescription]);

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

    const descriptionDirty = (description ?? '') !== (boardDescription ?? '');

    const handleSaveDescription = async () => {
        await updateBoard.mutateAsync({ description: description.trim() || null });
    };

    const handleDelete = async () => {
        await deleteBoard.mutateAsync(boardId);
        setConfirmDelete(false);
        onClose();
        router.push('/dashboard');
    };

    return (
        <>
            <dialog
                ref={dialogRef}
                className="modal"
                aria-labelledby={titleId}
                onClose={onClose}
            >
                <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Settings
                    </p>
                    <h2
                        id={titleId}
                        className="mt-4 font-display text-3xl font-medium tracking-tight"
                    >
                        {boardTitle}
                    </h2>

                    {/* Details */}
                    <section className="mt-10">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Details
                        </p>
                        <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
                            What this dojo is{' '}
                            <span className="italic text-primary">for.</span>
                        </h3>
                        <div className="mt-4">
                            <Field label="Description" htmlFor="dojo-description" optional>
                                <Textarea
                                    id="dojo-description"
                                    rows={3}
                                    placeholder="What is this dojo for?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={500}
                                />
                            </Field>
                            {descriptionDirty && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSaveDescription}
                                        disabled={updateBoard.isPending}
                                    >
                                        {updateBoard.isPending ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Access */}
                    <div className="mt-10 pt-10 border-t border-base-300">
                        <DojoAccessSection boardId={boardId} canManage={isCreator} />
                    </div>

                    {/* Danger — creator only */}
                    {isCreator && (
                        <section className="mt-10 pt-10 border-t border-base-300">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                                Danger
                            </p>
                            <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
                                Seal this dojo{' '}
                                <span className="italic text-primary">for good.</span>
                            </h3>
                            <p className="mt-3 text-sm text-base-content/70">
                                Delete the dojo and every kata it holds. This cannot be
                                undone.
                            </p>
                            <button
                                type="button"
                                className="mt-4 btn btn-error btn-outline btn-sm"
                                onClick={() => setConfirmDelete(true)}
                            >
                                Delete dojo
                            </button>
                        </section>
                    )}

                    <div className="mt-10 flex justify-end">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                        >
                            Done
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button type="submit" aria-label="Close">
                        close
                    </button>
                </form>
            </dialog>

            <ConfirmDialog
                open={confirmDelete}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={handleDelete}
                isConfirming={deleteBoard.isPending}
                eyebrow="Delete dojo"
                title="Delete this dojo?"
                body={
                    <>
                        <strong>{boardTitle}</strong> and every kata it holds will be
                        deleted. There is no undo.
                    </>
                }
                confirmLabel="Delete dojo"
            />
        </>
    );
}

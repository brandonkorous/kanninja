'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useBoards } from '@/hooks/use-boards';
import {
    useAttachClanToBoard,
    useBoardClans,
} from '@/hooks/use-board-clans';
import { Field, Select } from '@/components/ui';

type Role = 'viewer' | 'editor' | 'owner';

interface AttachDojoToClanModalProps {
    clanId: string;
    open: boolean;
    onClose: () => void;
}

// Inverse of the dojo-side attach flow (which now lives inline inside
// the Dojo Settings dialog). This one is reached from the clan detail
// page: the user picks one of THEIR dojos (boards they created) and
// grants THIS clan access to it at a chosen role.
//
// The POST /api/v1/boards/:boardId/clans endpoint is the same one the
// board-side attach flow uses. Only the board's creator can attach
// clans, so we filter the picker to `isCreator === true` boards.
//
// NOTE: we deliberately don't hit a "list of attached clans per board"
// endpoint upfront for every eligible board — that'd be N queries.
// Instead we lazily check the selected board's attachments (one query)
// and disable submit if the clan is already attached to it.
export function AttachDojoToClanModal({
    clanId,
    open,
    onClose,
}: AttachDojoToClanModalProps) {
    const { data: boards } = useBoards();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    const [boardId, setBoardId] = useState<string>('');
    const [role, setRole] = useState<Role>('editor');

    const attach = useAttachClanToBoard(boardId);
    // Look up the currently-selected board's attachments so we can warn
    // the user if this clan is already attached to it.
    const { data: attachedClans } = useBoardClans(boardId);

    // Eligible = boards the user CREATED. Non-creator owners-via-clan
    // can't attach clans to someone else's dojo.
    const eligible = useMemo(
        () => (boards ?? []).filter((b) => b.isCreator),
        [boards],
    );

    const alreadyAttached = useMemo(
        () => !!attachedClans?.some((a) => a.clanId === clanId),
        [attachedClans, clanId],
    );

    // Default selection to the first eligible board whenever the
    // eligible set changes and the current pick is stale.
    useEffect(() => {
        if (open && eligible.length > 0 && !eligible.find((b) => b.id === boardId)) {
            setBoardId(eligible[0].id);
        }
    }, [open, eligible, boardId]);

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
        if (!boardId || alreadyAttached) return;
        await attach.mutateAsync({ clanId, role });
        setBoardId('');
        setRole('editor');
        onClose();
    };

    const handleClose = () => {
        if (attach.isPending) return;
        onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={onClose}
            onCancel={(e) => {
                if (attach.isPending) e.preventDefault();
            }}
        >
            <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Grant access
                </p>
                <h3
                    id={titleId}
                    className="mt-4 font-display text-3xl font-medium tracking-tight"
                >
                    Attach a <span className="italic text-primary">dojo.</span>
                </h3>
                <p className="mt-3 text-sm text-base-content/70">
                    Pick one of your dojos. Members of this clan inherit the role.
                </p>

                {eligible.length === 0 ? (
                    <div className="mt-8">
                        <p className="text-sm text-base-content/60">
                            You haven't created any dojos yet. Open a dojo first, then
                            come back to grant this clan access.
                        </p>
                        <div className="mt-8 flex justify-end">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <Field label="Dojo" htmlFor="attach-dojo-id">
                            <Select
                                id="attach-dojo-id"
                                value={boardId}
                                onChange={(e) => setBoardId(e.target.value)}
                            >
                                {eligible.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.title}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field
                            label="Highest role"
                            htmlFor="attach-dojo-role"
                            hint="Each clanmate keeps their clan tier — admins act as owners, members as editors, readers as viewers — capped at this maximum."
                        >
                            <Select
                                id="attach-dojo-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                            >
                                <option value="viewer">Viewer — at most read only</option>
                                <option value="editor">Editor — at most edit cards</option>
                                <option value="owner">Owner — at most full control</option>
                            </Select>
                        </Field>

                        {alreadyAttached && (
                            <p
                                role="alert"
                                className="text-sm text-base-content/70 border-l-2 border-primary pl-4"
                            >
                                This clan is already attached to that dojo.
                            </p>
                        )}

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
                                disabled={attach.isPending || !boardId || alreadyAttached}
                            >
                                {attach.isPending ? 'Attaching…' : 'Grant access'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="submit" aria-label="Close">
                    close
                </button>
            </form>
        </dialog>
    );
}

'use client';

import { useEffect, useId, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface ConfirmDialogProps {
    /** Whether the dialog is visible. */
    open: boolean;
    /** Called when the user cancels or the dialog is dismissed via any
     *  native route (Escape, backdrop click, close button). */
    onCancel: () => void;
    /** Called when the user confirms the destructive action. */
    onConfirm: () => void;
    /** Short Fraunces headline, e.g. "Delete this kata?". */
    title: string;
    /** Optional eyebrow label shown above the title in vermillion mono caps. */
    eyebrow?: string;
    /** Supporting body copy explaining the consequence. One sentence, direct. */
    body: React.ReactNode;
    /** Confirm button label. Defaults to "Delete". */
    confirmLabel?: string;
    /** Cancel button label. Defaults to "Cancel". */
    cancelLabel?: string;
    /** Optional icon for the confirm button. Defaults to faTrash. */
    confirmIcon?: IconDefinition;
    /** Whether the confirm action is in-flight. Disables both buttons and
     *  blocks native Escape dismissal so the user can't lose the mutation. */
    isConfirming?: boolean;
}

/**
 * Hanko-themed destructive confirmation dialog.
 *
 * Replaces the native window.confirm() — on a cream-paper notebook UI, the
 * browser's OS-default modal is the single worst aesthetic break possible.
 * Uses the native <dialog> showModal() API so the browser provides focus
 * trap, Escape-to-cancel, body scroll lock, top-layer rendering, and focus
 * return to the trigger.
 */
export function ConfirmDialog({
    open,
    onCancel,
    onConfirm,
    title,
    eyebrow,
    body,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    confirmIcon = faTrash,
    isConfirming = false,
}: ConfirmDialogProps) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);

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

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={onCancel}
            onCancel={(e) => {
                // Block Escape while the confirm action is in-flight so the
                // user can't dismiss mid-mutation.
                if (isConfirming) e.preventDefault();
            }}
        >
            <div className="modal-box">
                {eyebrow && (
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        {eyebrow}
                    </p>
                )}
                <h3
                    id={titleId}
                    className="font-display text-2xl font-semibold leading-tight mt-2"
                >
                    {title}
                </h3>
                <div className="text-sm text-base-content/70 mt-3">{body}</div>
                <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="btn btn-error btn-outline"
                        onClick={onConfirm}
                        disabled={isConfirming}
                    >
                        <FontAwesomeIcon icon={confirmIcon} aria-hidden="true" className="mr-2" />
                        {isConfirming ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
            {/* Native-dialog backdrop pattern: a <form method="dialog"> inside
              * the dialog closes it when submitted. Disabled while confirming
              * so the user can't lose the in-flight mutation by clicking off. */}
            <form method="dialog" className="modal-backdrop">
                <button
                    type="submit"
                    aria-label="Close"
                    disabled={isConfirming}
                >
                    close
                </button>
            </form>
        </dialog>
    );
}

'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ConfirmDialog } from './confirm-dialog';

export interface LinkCardDeleteAction {
    /** Called when the user confirms the destructive action. May be async. */
    onConfirm: () => void | Promise<void>;
    /** Whether the delete mutation is in-flight — disables dialog buttons. */
    isConfirming: boolean;
    /** Vermillion mono-caps eyebrow above the dialog title, e.g. "Delete dojo". */
    eyebrow: string;
    /** Fraunces dialog title, e.g. "Delete this dojo?". */
    title: string;
    /** Body copy explaining the consequence. One sentence, direct. */
    body: ReactNode;
    /** Confirm button label, e.g. "Delete dojo". */
    confirmLabel: string;
    /** Accessible label for the trash icon button on the card. */
    ariaLabel: string;
}

interface LinkCardProps {
    /** Destination href — the whole tile links here. */
    href: string;
    /** Top-left accent icon. Pair a distinct IconDefinition with each card type. */
    icon: IconDefinition;
    /** Card heading — serif Fraunces. */
    title: string;
    /** Optional body text, line-clamped to 2 lines. */
    description?: string | null;
    /** Left-aligned meta (typically role) — rendered as mono-caps eyebrow. */
    metaStart?: ReactNode;
    /** Right-aligned meta (typically timestamp) — rendered as mono eyebrow. */
    metaEnd?: ReactNode;
    /** Accessible label for the overlay link, e.g. `Open ${title}`. */
    ariaLabel: string;
    /** Optional delete action. When provided, renders a trash button in the
     *  top-right that opens a Hanko ConfirmDialog. Gate visibility by only
     *  passing this prop when the user has permission to delete. */
    deleteAction?: LinkCardDeleteAction;
}

/**
 * Overlay-link card — the canonical Hanko tile for a dashboard / index page.
 *
 * Uses the anchor-overlay pattern: the whole tile is clickable, but the
 * button is NOT nested inside the anchor (HTML5 forbids interactive content
 * inside <a>). The <Link> is absolutely positioned over the article, and the
 * delete button is a sibling lifted above it with `pointer-events-auto`.
 * Decorative content (icon, title, description, meta) uses `pointer-events-
 * none` so clicks pass through to the Link.
 *
 * Consolidated from BoardCard + ClanCard — add a third consumer rather than
 * duplicating this pattern a third time.
 */
export function LinkCard({
    href,
    icon,
    title,
    description,
    metaStart,
    metaEnd,
    ariaLabel,
    deleteAction,
}: LinkCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleConfirmDelete = async () => {
        if (!deleteAction) return;
        await deleteAction.onConfirm();
        setShowDeleteDialog(false);
    };

    const hasMeta = metaStart !== undefined || metaEnd !== undefined;

    return (
        <>
            <article className="group relative hanko-lift bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-6 flex flex-col has-[a:focus-visible]:shadow-focus">
                <Link
                    href={href}
                    aria-label={ariaLabel}
                    className="absolute inset-0 rounded-lg focus:outline-none"
                />
                <div className="relative pointer-events-none flex items-start justify-between">
                    <FontAwesomeIcon
                        icon={icon}
                        className="text-primary text-xl"
                        aria-hidden="true"
                    />
                    {deleteAction && (
                        <button
                            type="button"
                            className="pointer-events-auto btn btn-ghost btn-sm md:btn-xs text-base-content/40 hover:text-error focus-visible:text-error"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowDeleteDialog(true);
                            }}
                            aria-label={deleteAction.ariaLabel}
                        >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                    )}
                </div>
                <h3 className="relative pointer-events-none mt-8 font-display text-xl font-medium tracking-tight text-base-content">
                    {title}
                </h3>
                {description && (
                    <p className="relative pointer-events-none mt-2 text-sm leading-relaxed text-base-content/60 line-clamp-2 flex-1">
                        {description}
                    </p>
                )}
                {hasMeta && (
                    <div className="relative pointer-events-none mt-6 pt-4 border-t border-base-300 flex items-baseline justify-between">
                        {metaStart !== undefined && (
                            <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                {metaStart}
                            </span>
                        )}
                        {metaEnd !== undefined && (
                            <span className="text-eyebrow font-mono text-base-content/60">
                                {metaEnd}
                            </span>
                        )}
                    </div>
                )}
            </article>

            {deleteAction && (
                <ConfirmDialog
                    open={showDeleteDialog}
                    onCancel={() => setShowDeleteDialog(false)}
                    onConfirm={handleConfirmDelete}
                    eyebrow={deleteAction.eyebrow}
                    title={deleteAction.title}
                    body={deleteAction.body}
                    confirmLabel={deleteAction.confirmLabel}
                    isConfirming={deleteAction.isConfirming}
                />
            )}
        </>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useUpdateCard, useDeleteCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { CardTabBar, type CardTab } from './card-tabs/CardTabBar';
import { DetailsTab } from './card-tabs/DetailsTab';
import { CommentsTab } from './card-tabs/CommentsTab';
import { ChecklistTab } from './card-tabs/ChecklistTab';
import { LabelsTab } from './card-tabs/LabelsTab';
import { TimeTab } from './card-tabs/TimeTab';
import { AttachmentsTab } from './card-tabs/AttachmentsTab';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { UpdateCardInput, Priority } from '@kanninja/shared';

interface CardDetailModalProps {
    boardId: string;
    card: {
        id: string;
        title: string;
        description: string | null;
        priority: string;
        isCompleted: boolean;
        startDate?: string | null;
        dueDate: string | null;
        estimatedHours: string | null;
        progress: number;
        assigneeId: string | null;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
    } | null;
    open: boolean;
    onClose: () => void;
}

export function CardDetailModal({ boardId, card, open, onClose }: CardDetailModalProps) {
    const [activeTab, setActiveTab] = useState<CardTab>('details');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<string>('none');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [estimatedHours, setEstimatedHours] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // pane instead of the tabbed editor. Cleared on close so reopening
    // the same card lands back on Details.
    const updateCard = useUpdateCard(boardId);
    const deleteCard = useDeleteCard(boardId);
    const dialogRef = useRef<HTMLDialogElement>(null);
    // Role gate from the cached useBoard query — viewers see the modal
    // as a read-only inspector. Per Hanko editing-patterns.md.
    const { canEdit } = useDojoPermissions(boardId);

    useEffect(() => {
        if (card) {
            setTitle(card.title);
            setDescription(card.description ?? '');
            setPriority(card.priority);
            setStartDate(card.startDate ? card.startDate.split('T')[0] : '');
            setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
            setIsCompleted(card.isCompleted);
            setAssigneeId(card.assigneeId);
            setEstimatedHours(card.estimatedHours ?? '');
            setActiveTab('details');
        }
    }, [card]);

    // Sync React state with the native dialog state machine so focus trap,
    // Escape, body scroll lock, and top-layer rendering all come from the
    // browser. Previously we toggled `.modal-open` which rendered visually
    // but gave none of those semantics.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            // showModal() auto-focuses the first focusable descendant.
            // With the inline-edit title now being that element, opening
            // the modal would land the user inside the title input —
            // visually startling and accidentally puts them in edit mode.
            // Redirect focus to the modal-box wrapper (tabIndex=-1) so
            // nothing visibly grabs focus on open. The user can still tab
            // forward into the title or click any field to start editing.
            requestAnimationFrame(() => {
                const wrapper = dialog.querySelector(
                    '[data-modal-focus-target]',
                ) as HTMLElement | null;
                wrapper?.focus();
            });
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    if (!card) return null;

    // Autosave per Hanko editing-patterns.md — each scalar commits on
    // its own. Text fields commit on blur (handleTitleBlur /
    // handleDescriptionBlur), select / date / checkbox commit on the
    // change handler. The parent never needs to think about a "Save"
    // button; the only time we batch is the close-flush below, which
    // catches the Escape-key path where blur doesn't fire on unmount.
    //
    // Viewers (canEdit=false) get the form as a fieldset disabled, so
    // these handlers shouldn't fire. We early-return anyway as a belt-
    // and-braces guard against any leaked event paths (browser
    // autofill, programmatic blur, etc).
    const commit = async (patch: Partial<UpdateCardInput>) => {
        if (!card || !canEdit) return;
        await updateCard.mutateAsync({ cardId: card.id, ...patch });
    };

    const handleTitleBlur = () => {
        const trimmed = title.trim();
        if (trimmed && trimmed !== card.title) {
            commit({ title: trimmed });
        }
    };

    const handleDescriptionBlur = () => {
        const trimmed = description.trim();
        const current = card.description ?? '';
        if (trimmed !== current) {
            commit({ description: trimmed || undefined });
        }
    };

    const handlePriorityChange = (v: string) => {
        setPriority(v);
        if (v !== card.priority) {
            commit({ priority: v as Priority });
        }
    };

    const handleStartDateChange = (v: string) => {
        setStartDate(v);
        const currentIso = card.startDate ? card.startDate.split('T')[0] : '';
        if (v !== currentIso) {
            commit({ startDate: v ? new Date(v).toISOString() : null });
        }
    };

    const handleDueDateChange = (v: string) => {
        setDueDate(v);
        const currentIso = card.dueDate ? card.dueDate.split('T')[0] : '';
        if (v !== currentIso) {
            commit({ dueDate: v ? new Date(v).toISOString() : undefined });
        }
    };

    const handleCompletedChange = (v: boolean) => {
        setIsCompleted(v);
        if (v !== card.isCompleted) {
            commit({ isCompleted: v });
        }
    };

    const handleAssigneeChange = (v: string) => {
        const newId = v || null;
        setAssigneeId(newId);
        if (newId !== card.assigneeId) {
            commit({ assigneeId: newId });
        }
    };

    const handleEstimatedHoursBlur = () => {
        const parsed = estimatedHours ? parseFloat(estimatedHours) : null;
        const current = card.estimatedHours ? parseFloat(card.estimatedHours) : null;
        if (parsed !== current) {
            commit({ estimatedHours: parsed });
        }
    };

    // Flush any unsaved text-field edits. Blur DOES fire when you click
    // outside or tab away, but the native dialog's Escape key tears the
    // input out of the DOM without firing blur, which would silently
    // drop the user's last typed change. Skipped entirely for viewers —
    // nothing to flush.
    const flushTextEdits = async () => {
        if (!card || !canEdit) return;
        const patch: Partial<UpdateCardInput> = {};
        const titleTrimmed = title.trim();
        if (titleTrimmed && titleTrimmed !== card.title) {
            patch.title = titleTrimmed;
        }
        const descTrimmed = description.trim();
        const currentDesc = card.description ?? '';
        if (descTrimmed !== currentDesc) {
            patch.description = descTrimmed || undefined;
        }
        if (Object.keys(patch).length > 0) {
            await commit(patch);
        }
    };

    const handleClose = async () => {
        await flushTextEdits();
        onClose();
    };

    const handleConfirmDelete = async () => {
        if (!card) return;
        await deleteCard.mutateAsync(card.id);
        setShowDeleteDialog(false);
        onClose();
    };

    return (
        <>
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby="card-modal-title"
            onClose={handleClose}
        >
            <div
                data-modal-focus-target
                tabIndex={-1}
                className="modal-box bg-base-100 rounded-xl shadow-e4 w-full max-w-2xl p-0 overflow-hidden focus:outline-none"
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-base-300 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Kata
                        </p>
                        {/* Inline-editable title. Looks like the original
                          * h3 at rest; on hover (for editors) gets a soft
                          * cream background to hint editability; on focus
                          * gets the Hanko vermillion ring. Enter commits,
                          * Escape reverts. The negative -mx-2 keeps the
                          * text aligned with the eyebrow above while
                          * giving the hover/focus chrome a tappable area
                          * that bleeds into the header padding. */}
                        <input
                            id="card-modal-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    (e.target as HTMLInputElement).blur();
                                }
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setTitle(card.title);
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            disabled={!canEdit}
                            placeholder="Untitled kata"
                            aria-label="Kata title"
                            className="mt-3 w-full font-display text-2xl md:text-3xl font-medium tracking-tight bg-transparent border-0 outline-none px-2 -mx-2 py-1 -my-1 rounded-md transition-colors hover:bg-base-200 focus:bg-base-100 focus:shadow-focus disabled:hover:bg-transparent disabled:cursor-default truncate"
                        />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 -mt-2 -mr-2">
                        <button
                            type="button"
                            aria-label="Close kata details"
                            className="btn btn-ghost btn-square"
                            onClick={handleClose}
                        >
                            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div>
                    <div className="flex flex-col">
                        <CardTabBar active={activeTab} onChange={setActiveTab} />
                        <div
                            role="tabpanel"
                            id={`tabpanel-${activeTab}`}
                            aria-labelledby={`tab-${activeTab}`}
                            className="px-8 py-6 min-h-[320px] max-h-[60vh] overflow-y-auto"
                        >
                            {activeTab === 'details' && (
                                // Viewers see the form as a read-only
                                // inspector. A disabled fieldset is the
                                // cheapest way to lock every input.
                                <fieldset disabled={!canEdit} className="contents">
                                    {/* Title is inline-edited in the modal header.
                                      * We still pass `title` so Suggest start date
                                      * has anchor context, but omit `onTitleChange`
                                      * — that gates DetailsTab's Title field off. */}
                                    <DetailsTab
                                        boardId={boardId}
                                        title={title}
                                        description={description}
                                        priority={priority}
                                        startDate={startDate}
                                        dueDate={dueDate}
                                        isCompleted={isCompleted}
                                        assigneeId={assigneeId}
                                        estimatedHours={estimatedHours}
                                        createdBy={card.createdBy}
                                        createdAt={card.createdAt}
                                        updatedAt={card.updatedAt}
                                        onDescriptionChange={setDescription}
                                        onPriorityChange={handlePriorityChange}
                                        onStartDateChange={handleStartDateChange}
                                        onDueDateChange={handleDueDateChange}
                                        onCompletedChange={handleCompletedChange}
                                        onAssigneeChange={handleAssigneeChange}
                                        onEstimatedHoursChange={setEstimatedHours}
                                        onEstimatedHoursBlur={handleEstimatedHoursBlur}
                                        onDescriptionBlur={handleDescriptionBlur}
                                    />
                                </fieldset>
                            )}
                            {activeTab === 'comments' && (
                                <CommentsTab boardId={boardId} cardId={card.id} />
                            )}
                            {activeTab === 'checklist' && (
                                <ChecklistTab
                                    boardId={boardId}
                                    cardId={card.id}
                                    canEdit={canEdit}
                                />
                            )}
                            {activeTab === 'labels' && (
                                <LabelsTab boardId={boardId} cardId={card.id} />
                            )}
                            {activeTab === 'time' && (
                                <TimeTab boardId={boardId} cardId={card.id} />
                            )}
                            {activeTab === 'attachments' && (
                                <AttachmentsTab boardId={boardId} cardId={card.id} />
                            )}
                        </div>
                    </div>

                </div>

                {/* Action bar — autosave per editing-patterns.md means no
                  * Save / Cancel buttons. Delete stays (destructive
                  * actions still need explicit confirmation). The right
                  * side shows a quiet "Saving…" only while a mutation
                  * is in flight, so the user gets feedback without a
                  * heavy primary button. */}
                <div className="px-8 py-4 border-t border-base-300 flex items-center justify-between gap-3 bg-base-200/40 min-h-[60px]">
                    {canEdit ? (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm text-base-content/60 hover:text-error"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" className="mr-2" />
                            Delete
                        </button>
                    ) : (
                        // Viewer footer — quiet eyebrow that explains why
                        // the form is locked. Better than an empty bar.
                        <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                            Read only
                        </span>
                    )}
                    {canEdit && updateCard.isPending && (
                        <span
                            role="status"
                            aria-live="polite"
                            className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
                        >
                            Saving…
                        </span>
                    )}
                </div>
            </div>
            {/* Native-dialog backdrop: a <form method="dialog"> inside the
              * dialog closes it when submitted. */}
            <form method="dialog" className="modal-backdrop">
                <button type="submit" aria-label="Close">
                    close
                </button>
            </form>
        </dialog>

        {/* Delete confirmation — rendered as a sibling of the card modal. With
          * native showModal() both dialogs stack correctly in the top layer,
          * so this could be nested, but keeping it as a sibling avoids any
          * ambiguity about which dialog's state wins on close. */}
        <ConfirmDialog
            open={showDeleteDialog}
            onCancel={() => setShowDeleteDialog(false)}
            onConfirm={handleConfirmDelete}
            eyebrow="Delete kata"
            title="Retire this kata?"
            body={
                <>
                    &ldquo;{card.title}&rdquo; and everything inside it will be
                    deleted. There is no undo.
                </>
            }
            confirmLabel="Delete kata"
            isConfirming={deleteCard.isPending}
        />
        </>
    );
}

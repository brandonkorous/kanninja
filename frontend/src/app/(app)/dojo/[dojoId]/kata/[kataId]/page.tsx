'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useBoard } from '@/hooks/use-boards';
import { useUpdateCard, useDeleteCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { CardTabBar, type CardTab } from '@/components/kanban/card-tabs/CardTabBar';
import { DetailsTab } from '@/components/kanban/card-tabs/DetailsTab';
import { CommentsTab } from '@/components/kanban/card-tabs/CommentsTab';
import { ChecklistTab } from '@/components/kanban/card-tabs/ChecklistTab';
import { LabelsTab } from '@/components/kanban/card-tabs/LabelsTab';
import { TimeTab } from '@/components/kanban/card-tabs/TimeTab';
import { AttachmentsTab } from '@/components/kanban/card-tabs/AttachmentsTab';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const priorities = ['none', 'low', 'medium', 'high', 'urgent'] as const;

/**
 * Full-page kata view. Same tabs and form as the CardDetailModal, but laid
 * out as a proper page so the kata earns real breathing room when a user
 * opens it in its own window (right-click → open in new tab, copied link
 * shared to a teammate, long comment thread, etc).
 *
 * State management mirrors CardDetailModal one-for-one; there's a bit of
 * duplication but the surfaces are different enough that extracting a
 * shared component would complicate both. If this page grows (checklists
 * in the hero, time log at the top), extract then.
 */
export default function KataPage() {
    const params = useParams();
    const router = useRouter();
    const dojoId = params.dojoId as string;
    const kataId = params.kataId as string;

    const { data: board, isLoading, error } = useBoard(dojoId);
    const updateCard = useUpdateCard(dojoId);
    const deleteCard = useDeleteCard(dojoId);
    // Role gate from the cached useBoard query — viewers see the page
    // as a read-only inspector. Per Hanko editing-patterns.md.
    const { canEdit } = useDojoPermissions(dojoId);

    const card = board?.lists.flatMap((l) => l.cards).find((c) => c.id === kataId) ?? null;

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
        }
    }, [card]);

    if (isLoading) {
        return (
            <p
                role="status"
                aria-live="polite"
                className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
            >
                Opening the kata…
            </p>
        );
    }

    if (error || !board || !card) {
        return (
            <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                    Sealed
                </p>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                    This kata is <span className="italic text-primary">sealed.</span>
                </h2>
                <p className="mt-3 text-sm text-base-content/70">
                    You may not have access, or the kata no longer exists.
                </p>
                <Link href={`/dojo/${dojoId}`} className="btn btn-outline btn-secondary mt-8">
                    Back to the dojo
                </Link>
            </div>
        );
    }

    const handleSave = async () => {
        await updateCard.mutateAsync({
            cardId: card.id,
            title: title.trim(),
            description: description.trim() || undefined,
            priority: priority as (typeof priorities)[number],
            startDate: startDate ? new Date(startDate).toISOString() : null,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            isCompleted,
        });
    };

    const handleConfirmDelete = async () => {
        await deleteCard.mutateAsync(card.id);
        setShowDeleteDialog(false);
        router.push(`/dojo/${dojoId}`);
    };

    return (
        <>
            <div className="max-w-3xl">
                {/* Header — mirrors the dojo page header pattern */}
                <header className="mb-10">
                    <Link
                        href={`/dojo/${dojoId}`}
                        className="inline-flex items-center gap-2 text-eyebrow font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                        Back to {board.title}
                    </Link>

                    <p className="mt-6 text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Kata
                    </p>
                    <h1 className="mt-3 font-display text-3xl md:text-4xl font-medium tracking-tight">
                        {card.title}
                    </h1>
                </header>

                {/* Tab bar reuses the same component as the modal */}
                <CardTabBar active={activeTab} onChange={setActiveTab} />

                {/* Tab panel */}
                <div
                    role="tabpanel"
                    id={`tabpanel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                    className="py-8"
                >
                    {activeTab === 'details' && (
                        // Same fieldset-disabled trick as the modal — locks
                        // every input for viewers without threading a
                        // readOnly prop down through DetailsTab.
                        <fieldset disabled={!canEdit} className="contents">
                            <DetailsTab
                                boardId={dojoId}
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
                                onTitleChange={setTitle}
                                onDescriptionChange={setDescription}
                                onPriorityChange={setPriority}
                                onStartDateChange={setStartDate}
                                onDueDateChange={setDueDate}
                                onCompletedChange={setIsCompleted}
                                onAssigneeChange={(v) => setAssigneeId(v || null)}
                                onEstimatedHoursChange={setEstimatedHours}
                            />
                        </fieldset>
                    )}
                    {activeTab === 'comments' && <CommentsTab boardId={dojoId} cardId={card.id} />}
                    {activeTab === 'checklist' && <ChecklistTab boardId={dojoId} cardId={card.id} />}
                    {activeTab === 'labels' && <LabelsTab boardId={dojoId} cardId={card.id} />}
                    {activeTab === 'time' && <TimeTab boardId={dojoId} cardId={card.id} />}
                    {activeTab === 'attachments' && <AttachmentsTab boardId={dojoId} cardId={card.id} />}
                </div>

                {/* Action bar — sticky bottom on a full page is a nice touch so
                  * Save is always in thumb reach without scrolling to the bottom.
                  * Viewers see the bar without Save / Delete (just a back link),
                  * with a quiet "Read only" eyebrow on the left so the locked
                  * form has an explanation. */}
                <div className="sticky bottom-0 border-t border-base-300 bg-base-200/80 backdrop-blur-sm py-4 mt-4 flex items-center justify-between gap-3">
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
                        <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                            Read only
                        </span>
                    )}
                    <div className="flex items-center gap-3">
                        <Link href={`/dojo/${dojoId}`} className="btn btn-ghost btn-sm">
                            {canEdit ? 'Cancel' : 'Back'}
                        </Link>
                        {canEdit && activeTab === 'details' && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleSave}
                                disabled={updateCard.isPending || !title.trim()}
                            >
                                {updateCard.isPending ? 'Saving…' : 'Save changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteDialog}
                onCancel={() => setShowDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                eyebrow="Delete kata"
                title="Retire this kata?"
                body={
                    <>
                        &ldquo;{card.title}&rdquo; and everything inside it will be deleted.
                        There is no undo.
                    </>
                }
                confirmLabel="Delete kata"
                isConfirming={deleteCard.isPending}
            />
        </>
    );
}

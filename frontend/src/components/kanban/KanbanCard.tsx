'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faAngleDown,
    faAngleUp,
    faEllipsisV,
    faTrash,
    faXmark,
    faLink,
    faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { KanbanCardContent } from './KanbanCardPreview';
import { useUpdateCard, useDeleteCard } from '@/hooks/use-cards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useToast } from '@/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu } from '@/components/ui/menu';

interface KanbanCardProps {
    id: string;
    boardId: string;
    title: string;
    description: string | null;
    priority: string;
    isCompleted: boolean;
    dueDate: string | null;
    assigneeAvatarUrl?: string | null;
    assigneeDisplayName?: string | null;
    onClick: () => void;
    /** Move this kata to the top of its current list. Owned by the column
     *  because the column has the full ordered list of cards needed to
     *  compute the new fractional index. */
    onMoveToTop: () => void;
    /** Move this kata to the bottom of its current list. Same rationale. */
    onMoveToBottom: () => void;
    /** True when this card is already at the top of its column (disables
     *  the "Move to top" menu item to prevent a no-op mutation). */
    isFirst: boolean;
    /** True when this card is already at the bottom of its column. */
    isLast: boolean;
}

export function KanbanCard({
    id,
    boardId,
    title,
    description,
    priority,
    isCompleted,
    dueDate,
    assigneeAvatarUrl,
    assigneeDisplayName,
    onClick,
    onMoveToTop,
    onMoveToBottom,
    isFirst,
    isLast,
}: KanbanCardProps) {
    // Read role straight from the cached useBoard query — no prop drilling.
    // Per Hanko editing-patterns.md: edit affordances must not render for
    // users without permission. The hook also returns reasonable defaults
    // (no edit) while the query is loading.
    const { canEdit } = useDojoPermissions(boardId);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        data: { type: 'card' },
        disabled: !canEdit,
    });

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const updateCard = useUpdateCard(boardId);
    const deleteCard = useDeleteCard(boardId);
    const toast = useToast();

    const kataUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/dojo/${boardId}/kata/${id}`
            : `/dojo/${boardId}/kata/${id}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(kataUrl);
            toast.success('Link copied.');
        } catch {
            toast.error('Could not copy link.');
        }
    };

    const handleOpenInNewTab = () => {
        window.open(kataUrl, '_blank', 'noopener,noreferrer');
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleToggleSealed = async () => {
        await updateCard.mutateAsync({
            cardId: id,
            isCompleted: !isCompleted,
        });
    };

    const handleConfirmDelete = async () => {
        await deleteCard.mutateAsync(id);
        setShowDeleteDialog(false);
    };

    return (
        <>
            <article
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                role="button"
                tabIndex={0}
                aria-label={`Open kata: ${title}`}
                className={`group relative bg-base-100 border border-base-300 shadow-e1 rounded-lg pl-4 pr-3 py-4 transition-all hover:border-base-content/20 hover:shadow-e2 hover:-translate-y-1 focus-visible:shadow-focus focus-visible:outline-none ${
                    canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
            >
                <div className="flex items-start gap-3">
                    <KanbanCardContent
                        title={title}
                        description={description}
                        priority={priority}
                        isCompleted={isCompleted}
                        dueDate={dueDate}
                        assigneeAvatarUrl={assigneeAvatarUrl}
                        assigneeDisplayName={assigneeDisplayName}
                    />

                    {/* Actions menu — portaled to document.body so it escapes
                      * overflow:hidden on the column + page wrappers. The
                      * Menu primitive also stops pointer/click events from
                      * bubbling to the card, so dnd-kit's drag listeners
                      * don't hijack menu interactions.
                      *
                      * Viewers (canEdit=false) get a collapsed menu with
                      * only the read-only items (copy link, open in new
                      * tab). Mutations are gone entirely — no disabled
                      * stub rows, no temptation. */}
                    <Menu
                        className="shrink-0"
                        trigger={
                            <button
                                type="button"
                                aria-label="Kata actions"
                                className="btn btn-ghost btn-sm md:btn-xs text-base-content/40 hover:text-base-content"
                            >
                                <FontAwesomeIcon icon={faEllipsisV} aria-hidden="true" />
                            </button>
                        }
                    >
                        {canEdit && (
                            <>
                                {/* Group 1 — primary state mutation */}
                                <Menu.Item
                                    onClick={handleToggleSealed}
                                    icon={isCompleted ? faXmark : faCheck}
                                >
                                    {isCompleted ? 'Unseal kata' : 'Seal as done'}
                                </Menu.Item>

                                <Menu.Separator />

                                {/* Group 2 — reposition within column */}
                                <Menu.Item
                                    onClick={onMoveToTop}
                                    icon={faAngleUp}
                                    disabled={isFirst}
                                >
                                    Move to top
                                </Menu.Item>
                                <Menu.Item
                                    onClick={onMoveToBottom}
                                    icon={faAngleDown}
                                    disabled={isLast}
                                >
                                    Move to bottom
                                </Menu.Item>

                                <Menu.Separator />
                            </>
                        )}

                        {/* Group 3 — link / navigation. Always available; a
                          * viewer can still share the kata. */}
                        <Menu.Item onClick={handleCopyLink} icon={faLink}>
                            Copy kata link
                        </Menu.Item>
                        <Menu.Item
                            onClick={handleOpenInNewTab}
                            icon={faArrowUpRightFromSquare}
                        >
                            Open in new tab
                        </Menu.Item>

                        {canEdit && (
                            <>
                                <Menu.Separator />

                                {/* Group 4 — destructive */}
                                <Menu.Item
                                    onClick={() => setShowDeleteDialog(true)}
                                    icon={faTrash}
                                    destructive
                                >
                                    Delete kata
                                </Menu.Item>
                            </>
                        )}
                    </Menu>
                </div>
            </article>

            <ConfirmDialog
                open={showDeleteDialog}
                onCancel={() => setShowDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                eyebrow="Delete kata"
                title="Retire this kata?"
                body={
                    <>
                        &ldquo;{title}&rdquo; and everything inside it will be deleted. There
                        is no undo.
                    </>
                }
                confirmLabel="Delete kata"
                isConfirming={deleteCard.isPending}
            />
        </>
    );
}

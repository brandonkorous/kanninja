'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faClock,
    faFire,
    faArrowUp,
    faMinus,
    faAngleDown,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface KanbanCardVisualProps {
    title: string;
    description: string | null;
    priority: string;
    isCompleted: boolean;
    dueDate: string | null;
    assigneeAvatarUrl?: string | null;
    assigneeDisplayName?: string | null;
}

const priorityIcons: Record<string, IconDefinition> = {
    urgent: faFire,
    high: faArrowUp,
    medium: faMinus,
    low: faAngleDown,
};

// Priority color lives in TEXT, not in chrome — the card itself stays neutral.
const priorityTextColor: Record<string, string> = {
    urgent: 'text-error',
    high: 'text-warning',
    medium: 'text-info',
    low: 'text-base-content/50',
};

/**
 * The pure visual content of a kanban card — title, description, and the
 * meta row (priority / due date / sealed). Both the live, sortable
 * KanbanCard and the DragOverlay's KanbanCardPreview render this so the
 * card visuals stay in lockstep. No interactivity, no hooks.
 */
export function KanbanCardContent({
    title,
    description,
    priority,
    isCompleted,
    dueDate,
    assigneeAvatarUrl,
    assigneeDisplayName,
}: KanbanCardVisualProps) {
    return (
        <div className="flex-1 min-w-0">
            <h3
                className={`font-display text-lg font-semibold leading-snug ${
                    isCompleted ? 'line-through text-base-content/50' : ''
                }`}
            >
                {title}
            </h3>

            {description && (
                <p className="text-sm text-base-content/70 line-clamp-2 mt-2">
                    {description}
                </p>
            )}

            {(priority !== 'none' || dueDate || isCompleted || assigneeAvatarUrl || assigneeDisplayName) && (
                <div className="flex items-center gap-4 mt-3 font-mono text-eyebrow uppercase tracking-wider">
                    {priority !== 'none' && (
                        <span
                            className={`flex items-center gap-1.5 ${
                                priorityTextColor[priority] ?? ''
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={priorityIcons[priority]}
                                aria-hidden="true"
                            />
                            {priority}
                        </span>
                    )}
                    {dueDate && (
                        <span className="flex items-center gap-1.5 text-base-content/60">
                            <FontAwesomeIcon icon={faClock} aria-hidden="true" />
                            {new Date(dueDate).toLocaleDateString()}
                        </span>
                    )}
                    {isCompleted && (
                        <span className="flex items-center gap-1.5 text-success">
                            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                            sealed
                        </span>
                    )}
                    {(assigneeAvatarUrl || assigneeDisplayName) && (
                        <span className="ml-auto flex items-center gap-1.5" title={assigneeDisplayName ?? undefined}>
                            <span className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center shrink-0 overflow-hidden">
                                {assigneeAvatarUrl ? (
                                    <img src={assigneeAvatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FontAwesomeIcon icon={faUser} className="text-[10px] text-base-content/40" />
                                )}
                            </span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Drag-overlay version of a kanban card. Mirrors the in-list KanbanCard's
 * chrome (border, soft shadow, generous radius, asymmetric padding) so the
 * thing you're "holding" is the thing you saw. Lifted with shadow-e3 and a
 * small rotation to read as picked up. No hooks, no listeners — purely
 * presentational. Width matches the live card (268px = column w-72 minus
 * pl-3 minus pr-2) so there's no size jump on grab.
 */
export function KanbanCardPreview(props: KanbanCardVisualProps) {
    return (
        <div className="w-[268px] bg-base-100 border border-base-300 shadow-e3 rounded-lg pl-4 pr-3 py-4 rotate-3 cursor-grabbing">
            <div className="flex items-start gap-3">
                <KanbanCardContent {...props} />
            </div>
        </div>
    );
}

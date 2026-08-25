'use client';

import { useState } from 'react';
import {
    useChecklist,
    useCreateChecklistItem,
    useUpdateChecklistItem,
    useDeleteChecklistItem,
} from '@/hooks/use-card-features';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

interface ChecklistTabProps {
    boardId: string;
    cardId: string;
    canEdit: boolean;
}

export function ChecklistTab({
    boardId,
    cardId,
    canEdit,
}: ChecklistTabProps) {
    const { data: items } = useChecklist(boardId, cardId);
    const create = useCreateChecklistItem(boardId, cardId);
    const update = useUpdateChecklistItem(boardId, cardId);
    const del = useDeleteChecklistItem(boardId, cardId);
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await create.mutateAsync(title.trim());
        setTitle('');
    };

    const completed = items?.filter((i) => i.completed).length ?? 0;
    const total = items?.length ?? 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="space-y-6">
            {total > 0 && (
                <div>
                    <div className="flex justify-between text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-2">
                        <span>Progress</span>
                        <span>
                            {completed}/{total} · {percent}%
                        </span>
                    </div>
                    <progress
                        className="progress progress-primary w-full"
                        value={completed}
                        max={total}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    className="input input-bordered input-sm flex-1 focus:shadow-focus"
                    placeholder="Add a step…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEdit}
                />
                <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!title.trim() || !canEdit}
                    aria-label="Add checklist item"
                >
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                </button>
            </form>

            <div className="space-y-1 max-h-80 overflow-y-auto">
                {items?.length === 0 && (
                    <div className="py-4">
                        <p className="text-sm text-base-content/50">
                            No steps yet. Break the kata into pieces.
                        </p>
                    </div>
                )}
                {items?.map((item) => (
                    <label
                        key={item.id}
                        className="group flex items-center gap-3 hover:bg-base-200 rounded-md p-2 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={item.completed}
                            onChange={(e) =>
                                update.mutate({ itemId: item.id, completed: e.target.checked })
                            }
                            disabled={!canEdit}
                        />
                        <span
                            className={`text-sm flex-1 ${
                                item.completed
                                    ? 'line-through text-base-content/40'
                                    : 'text-base-content'
                            }`}
                        >
                            {item.title}
                        </span>
                        {canEdit && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.preventDefault();
                                    del.mutate(item.id);
                                }}
                                aria-label={`Delete ${item.title}`}
                            >
                                <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                            </button>
                        )}
                    </label>
                ))}
            </div>
        </div>
    );
}

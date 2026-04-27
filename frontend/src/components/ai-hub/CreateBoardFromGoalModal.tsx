'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { Field, Input } from '@/components/ui';
import type { Board } from '@kanninja/shared';
import type { DecomposedTask } from './DecomposeGoalWorkspace';

// Sequential mutations: board → 3 lists → N cards. The picker hooks invalidate
// caches and toast individually, which would carpet-bomb the user with
// "Dojo opened. List added. Kata added. Kata added…". So we call the API
// directly here, then invalidate boards once at the end.

const STARTER_LISTS = ['Backlog', 'Doing', 'Done'] as const;
const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent']);

function normalizePriority(p?: string): string {
    const lower = p?.toLowerCase().trim();
    return lower && VALID_PRIORITIES.has(lower) ? lower : 'medium';
}

export function CreateBoardFromGoalModal({
    open,
    onClose,
    suggestedTitle,
    tasks,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    suggestedTitle: string;
    tasks: DecomposedTask[];
    onSuccess: (boardId: string) => void;
}) {
    const [title, setTitle] = useState(suggestedTitle);
    const [progress, setProgress] = useState<{ step: string; n?: number; of?: number } | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();

    useEffect(() => setTitle(suggestedTitle), [suggestedTitle]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    const isWorking = progress !== null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isWorking) return;
        try {
            setProgress({ step: 'Opening dojo' });
            const board = await api
                .post<{ data: Board }>('/api/v1/boards', { title: title.trim() })
                .then((r) => r.data);

            // Three columns matching v1's starter pattern.
            const listIds: string[] = [];
            for (let i = 0; i < STARTER_LISTS.length; i += 1) {
                setProgress({ step: 'Adding lists', n: i + 1, of: STARTER_LISTS.length });
                const list = await api
                    .post<{ data: { id: string } }>(`/api/v1/boards/${board.id}/lists`, {
                        title: STARTER_LISTS[i],
                    })
                    .then((r) => r.data);
                listIds.push(list.id);
            }

            // All cards land in Backlog (first list).
            const backlogId = listIds[0];
            for (let i = 0; i < tasks.length; i += 1) {
                setProgress({ step: 'Adding kata', n: i + 1, of: tasks.length });
                const t = tasks[i];
                await api.post(`/api/v1/boards/${board.id}/cards`, {
                    listId: backlogId,
                    title: t.title,
                    description: t.description || undefined,
                    priority: normalizePriority(t.priority),
                    estimatedHours:
                        typeof t.estimated_hours === 'number' && t.estimated_hours > 0
                            ? t.estimated_hours
                            : undefined,
                });
            }

            qc.invalidateQueries({ queryKey: ['boards'] });
            toast.success(`Dojo opened — ${tasks.length} kata added.`);
            setProgress(null);
            onSuccess(board.id);
        } catch (err) {
            toast.error(getToastErrorMessage(err));
            setProgress(null);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={onClose}
            onCancel={(e) => {
                if (isWorking) e.preventDefault();
            }}
        >
            <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-md p-8">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    New dojo from goal
                </p>
                <h3
                    id={titleId}
                    className="mt-4 font-display text-3xl font-medium tracking-tight"
                >
                    Open a <span className="italic text-primary">dojo.</span>
                </h3>
                <p className="mt-3 text-sm text-base-content/70">
                    Three lists — Backlog, Doing, Done. {tasks.length} kata land in Backlog.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <Field label="Dojo name" htmlFor="board-from-goal-title">
                        <Input
                            id="board-from-goal-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            required
                            maxLength={100}
                            disabled={isWorking}
                        />
                    </Field>

                    {progress && (
                        <p
                            className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                            aria-live="polite"
                        >
                            {progress.step}
                            {progress.n && progress.of
                                ? ` — ${progress.n} of ${progress.of}`
                                : '…'}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-4 pt-2">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={isWorking}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isWorking || !title.trim()}
                        >
                            {isWorking ? 'Opening…' : 'Open dojo'}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="submit" aria-label="Close" disabled={isWorking}>
                    close
                </button>
            </form>
        </dialog>
    );
}

'use client';

import { useState } from 'react';
import { useParseTask } from '@/hooks/use-ai';
import { useApi } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { Field, Textarea } from '@/components/ui';
import { BoardListPicker, type BoardListSelection } from './BoardListPicker';
import { WorkspaceShell, WorkspaceError, WorkspaceFooter } from './WorkspaceShell';
import {
    DraftCardForm,
    type DraftCard,
    normalizeDraftPriority,
} from './DraftCardForm';

function dateToIsoDateTime(d: string): string | undefined {
    if (!d) return undefined;
    const parsed = new Date(`${d}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function ParseTaskWorkspace() {
    const [input, setInput] = useState('');
    const [draft, setDraft] = useState<DraftCard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [picker, setPicker] = useState<BoardListSelection>({ boardId: '', listId: '' });
    const [created, setCreated] = useState<{
        boardId: string;
        boardTitle?: string;
        listTitle?: string;
    } | null>(null);
    const [creating, setCreating] = useState(false);

    const parseTask = useParseTask();
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();

    const handleRun = async () => {
        setError(null);
        setCreated(null);
        try {
            const r = await parseTask.mutateAsync(input);
            setDraft({
                title: r.title ?? '',
                description: r.description ?? '',
                priority: normalizeDraftPriority(r.priority),
                dueDate: r.due_date ?? '',
                estimatedHours: '',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The model went quiet. Try again.');
        }
    };

    const handleCreate = async () => {
        if (!draft || !picker.listId || creating) return;
        setCreating(true);
        try {
            await api.post(`/api/v1/boards/${picker.boardId}/cards`, {
                listId: picker.listId,
                title: draft.title.trim(),
                description: draft.description.trim() || undefined,
                priority: draft.priority,
                dueDate: dateToIsoDateTime(draft.dueDate),
                estimatedHours:
                    draft.estimatedHours && Number(draft.estimatedHours) > 0
                        ? Number(draft.estimatedHours)
                        : undefined,
            });
            qc.invalidateQueries({ queryKey: ['boards', picker.boardId] });
            qc.invalidateQueries({ queryKey: ['scheduled-cards'] });
            toast.success(
                `Kata added to ${picker.boardTitle ?? 'dojo'} · ${picker.listTitle ?? 'list'}.`,
            );
            setCreated({
                boardId: picker.boardId,
                boardTitle: picker.boardTitle,
                listTitle: picker.listTitle,
            });
            setDraft(null);
            setInput('');
        } catch (err) {
            toast.error(getToastErrorMessage(err));
        } finally {
            setCreating(false);
        }
    };

    return (
        <WorkspaceShell
            number="02"
            label="Parse a task"
            body="Type a paragraph; review the kata; drop it on a board."
        >
            {!draft && !created && (
                <div className="mt-8">
                    <Field label="What needs to happen?" htmlFor="parse-input">
                        <Textarea
                            id="parse-input"
                            rows={4}
                            placeholder="Need to review PR #123 by Friday, high priority, assign to Alex"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </Field>
                    {error && <WorkspaceError message={error} />}
                    <WorkspaceFooter>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleRun}
                            disabled={parseTask.isPending || !input.trim()}
                        >
                            {parseTask.isPending ? 'Reading…' : 'Parse it'}
                        </button>
                    </WorkspaceFooter>
                </div>
            )}

            {draft && (
                <div className="mt-10 border-t border-base-300 pt-8 space-y-6">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                        Suggestion · edit before saving
                    </p>
                    <DraftCardForm draft={draft} onChange={setDraft} disabled={creating} />
                    <div className="border-t border-base-300 pt-6">
                        <BoardListPicker value={picker} onChange={setPicker} disabled={creating} />
                    </div>
                    <WorkspaceFooter>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                                setDraft(null);
                                setError(null);
                            }}
                            disabled={creating}
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={
                                creating || !draft.title.trim() || !picker.boardId || !picker.listId
                            }
                        >
                            {creating ? 'Adding…' : 'Add kata'}
                        </button>
                    </WorkspaceFooter>
                </div>
            )}

            {created && (
                <div className="mt-10 border-t border-base-300 pt-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Done
                    </p>
                    <p className="mt-3 text-base text-base-content/80">
                        Added to{' '}
                        <a
                            href={`/boards/${created.boardId}`}
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            {created.boardTitle ?? 'your dojo'}
                        </a>
                        {created.listTitle ? ` · ${created.listTitle}` : ''}.
                    </p>
                    <WorkspaceFooter>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setCreated(null)}
                        >
                            Parse another
                        </button>
                    </WorkspaceFooter>
                </div>
            )}
        </WorkspaceShell>
    );
}

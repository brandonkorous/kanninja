'use client';

import { useState } from 'react';
import { useDecomposeGoal } from '@/hooks/use-ai';
import { useApi } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { Field, Textarea } from '@/components/ui';
import { BoardListPicker, type BoardListSelection } from './BoardListPicker';
import { CreateBoardFromGoalModal } from './CreateBoardFromGoalModal';
import { WorkspaceShell, WorkspaceError, WorkspaceFooter } from './WorkspaceShell';
import { TaskRoster } from './TaskRoster';

export interface DecomposedTask {
    title: string;
    description: string;
    priority: string;
    estimated_hours: number;
}

const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent']);

function normalizePriority(p?: string): string {
    const lower = p?.toLowerCase().trim();
    return lower && VALID_PRIORITIES.has(lower) ? lower : 'medium';
}

function deriveBoardTitle(goal: string): string {
    const trimmed = goal.trim();
    if (trimmed.length <= 60) return trimmed;
    // Cut at last word boundary before 60 chars.
    const slice = trimmed.slice(0, 60);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 30 ? slice.slice(0, lastSpace) : slice).trim();
}

type Mode = 'idle' | 'new-board' | 'existing-board';

export function DecomposeGoalWorkspace() {
    const [input, setInput] = useState('');
    const [tasks, setTasks] = useState<DecomposedTask[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>('idle');
    const [picker, setPicker] = useState<BoardListSelection>({ boardId: '', listId: '' });
    const [adding, setAdding] = useState<{ n: number; of: number } | null>(null);

    const decompose = useDecomposeGoal();
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();

    const handleRun = async () => {
        setError(null);
        try {
            const r = await decompose.mutateAsync({ goal: input });
            setTasks(r.tasks ?? []);
            setMode('idle');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The model went quiet. Try again.');
        }
    };

    const handleAddToExisting = async () => {
        if (!tasks || !picker.listId || adding) return;
        try {
            for (let i = 0; i < tasks.length; i += 1) {
                setAdding({ n: i + 1, of: tasks.length });
                const t = tasks[i];
                await api.post(`/api/v1/boards/${picker.boardId}/cards`, {
                    listId: picker.listId,
                    title: t.title,
                    description: t.description || undefined,
                    priority: normalizePriority(t.priority),
                    estimatedHours:
                        typeof t.estimated_hours === 'number' && t.estimated_hours > 0
                            ? t.estimated_hours
                            : undefined,
                });
            }
            qc.invalidateQueries({ queryKey: ['boards', picker.boardId] });
            qc.invalidateQueries({ queryKey: ['scheduled-cards'] });
            toast.success(`${tasks.length} kata added to ${picker.boardTitle ?? 'dojo'}.`);
            setTasks(null);
            setInput('');
            setMode('idle');
        } catch (err) {
            toast.error(getToastErrorMessage(err));
        } finally {
            setAdding(null);
        }
    };

    return (
        <WorkspaceShell
            number="03"
            label="Decompose a goal"
            body="Break a big thing into small things you will actually finish."
        >
            {!tasks && (
                <div className="mt-8">
                    <Field label="The goal" htmlFor="decompose-input">
                        <Textarea
                            id="decompose-input"
                            rows={3}
                            placeholder="Launch the Hanko design system to the v2 marketing site by end of month"
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
                            disabled={decompose.isPending || !input.trim()}
                        >
                            {decompose.isPending ? 'Decomposing…' : 'Decompose it'}
                        </button>
                    </WorkspaceFooter>
                </div>
            )}

            {tasks && (
                <div className="mt-10 border-t border-base-300 pt-8 space-y-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                        Suggested kata · {tasks.length}
                    </p>

                    <TaskRoster tasks={tasks} />

                    {mode === 'existing-board' && (
                        <div className="border-t border-base-300 pt-6">
                            <BoardListPicker value={picker} onChange={setPicker} disabled={!!adding} />
                        </div>
                    )}

                    {adding && (
                        <p
                            className="text-eyebrow font-mono uppercase tracking-widest text-primary"
                            aria-live="polite"
                        >
                            Adding kata — {adding.n} of {adding.of}
                        </p>
                    )}

                    <WorkspaceFooter>
                        {mode === 'idle' && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setTasks(null);
                                        setMode('idle');
                                    }}
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setMode('existing-board')}
                                >
                                    Add to existing dojo
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setMode('new-board')}
                                >
                                    Open new dojo
                                </button>
                            </>
                        )}
                        {mode === 'existing-board' && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setMode('idle')}
                                    disabled={!!adding}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddToExisting}
                                    disabled={!!adding || !picker.boardId || !picker.listId}
                                >
                                    {adding ? 'Adding…' : `Add ${tasks.length} kata`}
                                </button>
                            </>
                        )}
                    </WorkspaceFooter>
                </div>
            )}

            <CreateBoardFromGoalModal
                open={mode === 'new-board'}
                onClose={() => setMode('idle')}
                suggestedTitle={deriveBoardTitle(input)}
                tasks={tasks ?? []}
                onSuccess={() => {
                    setTasks(null);
                    setInput('');
                    setMode('idle');
                }}
            />
        </WorkspaceShell>
    );
}

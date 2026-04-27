'use client';

import { useState } from 'react';
import { useAnalyzeMeeting } from '@/hooks/use-ai';
import { useApi } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { Field, Textarea } from '@/components/ui';
import { BoardListPicker, type BoardListSelection } from './BoardListPicker';
import { WorkspaceShell, WorkspaceError, WorkspaceFooter } from './WorkspaceShell';
import {
    ActionItemEditor,
    normalizeActionPriority,
    type ActionDraft,
} from './ActionItemEditor';

interface MeetingResult {
    summary: string;
    action_items: Array<{ title: string; assignee?: string; priority: string; due_date?: string }>;
    decisions: string[];
    questions: string[];
}

function dateToIsoDateTime(d: string): string | undefined {
    if (!d) return undefined;
    const parsed = new Date(`${d}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function MeetingWorkspace() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<MeetingResult | null>(null);
    const [drafts, setDrafts] = useState<ActionDraft[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [picker, setPicker] = useState<BoardListSelection>({ boardId: '', listId: '' });
    const [adding, setAdding] = useState<{ n: number; of: number } | null>(null);

    const meeting = useAnalyzeMeeting();
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();

    const handleRun = async () => {
        setError(null);
        try {
            const r = (await meeting.mutateAsync({ transcript: input })) as MeetingResult;
            setResult(r);
            setDrafts(
                (r.action_items ?? []).map((a) => ({
                    selected: true,
                    title: a.title,
                    priority: normalizeActionPriority(a.priority),
                    dueDate: a.due_date ?? '',
                })),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The model went quiet. Try again.');
        }
    };

    const updateDraft = (i: number, patch: Partial<ActionDraft>) => {
        setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    };

    const selectedCount = drafts.filter((d) => d.selected).length;

    const handleCreate = async () => {
        if (!picker.listId || adding || selectedCount === 0) return;
        const toCreate = drafts.filter((d) => d.selected);
        try {
            for (let i = 0; i < toCreate.length; i += 1) {
                setAdding({ n: i + 1, of: toCreate.length });
                const d = toCreate[i];
                await api.post(`/api/v1/boards/${picker.boardId}/cards`, {
                    listId: picker.listId,
                    title: d.title.trim(),
                    priority: d.priority,
                    dueDate: dateToIsoDateTime(d.dueDate),
                });
            }
            qc.invalidateQueries({ queryKey: ['boards', picker.boardId] });
            qc.invalidateQueries({ queryKey: ['scheduled-cards'] });
            toast.success(`${toCreate.length} kata added to ${picker.boardTitle ?? 'dojo'}.`);
            setResult(null);
            setDrafts([]);
            setInput('');
        } catch (err) {
            toast.error(getToastErrorMessage(err));
        } finally {
            setAdding(null);
        }
    };

    return (
        <WorkspaceShell
            number="04"
            label="Pull tasks from notes"
            body="Paste meeting notes; review the action items; drop them on a board."
        >
            {!result && (
                <div className="mt-8">
                    <Field label="Meeting notes" htmlFor="meeting-input">
                        <Textarea
                            id="meeting-input"
                            rows={6}
                            placeholder="Paste meeting notes here…"
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
                            disabled={meeting.isPending || !input.trim()}
                        >
                            {meeting.isPending ? 'Reading…' : 'Pull the tasks'}
                        </button>
                    </WorkspaceFooter>
                </div>
            )}

            {result && (
                <div className="mt-10 border-t border-base-300 pt-8 space-y-10">
                    {result.summary && (
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                Summary
                            </p>
                            <p className="mt-3 text-base text-base-content/80 leading-relaxed">
                                {result.summary}
                            </p>
                        </div>
                    )}

                    {result.decisions?.length > 0 && (
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                Decisions
                            </p>
                            <ul className="mt-3 space-y-2">
                                {result.decisions.map((d, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-3 text-sm text-base-content/80"
                                    >
                                        <span className="font-mono text-xs text-base-content/30 mt-1 tabular-nums">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="flex-1 leading-relaxed">{d}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Action items · {selectedCount} of {drafts.length} selected
                        </p>
                        <ActionItemEditor drafts={drafts} onUpdate={updateDraft} />
                    </div>

                    {drafts.length > 0 && (
                        <div className="border-t border-base-300 pt-6">
                            <BoardListPicker
                                value={picker}
                                onChange={setPicker}
                                disabled={!!adding}
                            />
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
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                                setResult(null);
                                setDrafts([]);
                            }}
                            disabled={!!adding}
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={
                                !!adding ||
                                selectedCount === 0 ||
                                !picker.boardId ||
                                !picker.listId
                            }
                        >
                            {adding ? 'Adding…' : `Add ${selectedCount} kata`}
                        </button>
                    </WorkspaceFooter>
                </div>
            )}
        </WorkspaceShell>
    );
}

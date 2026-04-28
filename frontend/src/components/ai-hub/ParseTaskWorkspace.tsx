'use client';

import { useState } from 'react';
import { useParseTask, useGenerateChecklist } from '@/hooks/use-ai';
import { Field, Textarea } from '@/components/ui';
import { type BoardListSelection } from './BoardListPicker';
import { WorkspaceShell, WorkspaceError, WorkspaceFooter } from './WorkspaceShell';
import { type DraftCard, normalizeDraftPriority } from './DraftCardForm';
import { makeSuggestions, type SuggestedLabel } from './LabelSuggestionPicker';
import { ParseTaskDraftReview } from './ParseTaskDraftReview';
import { useParseTaskCreate, type CreatedCard } from './useParseTaskCreate';

export function ParseTaskWorkspace() {
    const [input, setInput] = useState('');
    const [draft, setDraft] = useState<DraftCard | null>(null);
    const [checklist, setChecklist] = useState<string[]>([]);
    const [labels, setLabels] = useState<SuggestedLabel[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [picker, setPicker] = useState<BoardListSelection>({ boardId: '', listId: '' });
    const [created, setCreated] = useState<CreatedCard | null>(null);
    const [enriching, setEnriching] = useState(false);

    const parseTask = useParseTask();
    const generateChecklist = useGenerateChecklist();
    const { create, creating } = useParseTaskCreate();

    const handleRun = async () => {
        setError(null);
        setCreated(null);
        try {
            const r = await parseTask.mutateAsync(input);
            const newDraft: DraftCard = {
                title: r.title ?? '',
                description: r.description ?? '',
                priority: normalizeDraftPriority(r.priority),
                dueDate: r.due_date ?? '',
                estimatedHours:
                    typeof r.estimated_hours === 'number' && r.estimated_hours > 0
                        ? String(r.estimated_hours)
                        : '',
            };
            setDraft(newDraft);
            setLabels(makeSuggestions(r.tags ?? []));
            // Pass 2: dedicated checklist call. Sharper than reusing
            // parseTask's subtasks because it gets the model's full
            // attention on this one card.
            setEnriching(true);
            try {
                const cl = await generateChecklist.mutateAsync({
                    title: newDraft.title,
                    description: newDraft.description || undefined,
                    priority: newDraft.priority,
                });
                setChecklist(cl.steps ?? []);
            } catch {
                setChecklist([]);
            } finally {
                setEnriching(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The model went quiet. Try again.');
        }
    };

    const handleCreate = async () => {
        if (!draft) return;
        const result = await create({ draft, checklist, labels, picker });
        if (result) {
            setCreated(result);
            setDraft(null);
            setChecklist([]);
            setLabels([]);
            setInput('');
        }
    };

    const handleDiscard = () => {
        setDraft(null);
        setChecklist([]);
        setLabels([]);
        setError(null);
    };

    return (
        <WorkspaceShell
            number="02"
            label="Parse a task"
            body="Type a paragraph; review the kata, its checklist, and labels; drop it on a board."
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
                <ParseTaskDraftReview
                    draft={draft}
                    onDraftChange={setDraft}
                    checklist={checklist}
                    onChecklistChange={setChecklist}
                    enriching={enriching}
                    labels={labels}
                    onLabelsChange={setLabels}
                    picker={picker}
                    onPickerChange={setPicker}
                    creating={creating}
                    onDiscard={handleDiscard}
                    onCreate={handleCreate}
                />
            )}

            {created && (
                <div className="mt-10 border-t border-base-300 pt-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Done
                    </p>
                    <p className="mt-3 text-base text-base-content/80">
                        Added to{' '}
                        <a
                            href={`/dojo/${created.boardId}/board`}
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

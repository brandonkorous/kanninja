'use client';

import { DraftCardForm, type DraftCard } from './DraftCardForm';
import { DraftChecklistEditor } from './DraftChecklistEditor';
import { LabelSuggestionPicker, type SuggestedLabel } from './LabelSuggestionPicker';
import { BoardListPicker, type BoardListSelection } from './BoardListPicker';
import { WorkspaceFooter } from './WorkspaceShell';

// The post-parse review surface. Renders the draft as editable fields,
// the AI-generated checklist (still drafting if `enriching`), suggested
// labels, and the board+list picker. Pure presentation — every action
// flows back through props.

export function ParseTaskDraftReview({
    draft,
    onDraftChange,
    checklist,
    onChecklistChange,
    enriching,
    labels,
    onLabelsChange,
    picker,
    onPickerChange,
    creating,
    onDiscard,
    onCreate,
}: {
    draft: DraftCard;
    onDraftChange: (next: DraftCard) => void;
    checklist: string[];
    onChecklistChange: (next: string[]) => void;
    enriching: boolean;
    labels: SuggestedLabel[];
    onLabelsChange: (next: SuggestedLabel[]) => void;
    picker: BoardListSelection;
    onPickerChange: (next: BoardListSelection) => void;
    creating: boolean;
    onDiscard: () => void;
    onCreate: () => void;
}) {
    return (
        <div className="mt-10 border-t border-base-300 pt-8 space-y-8">
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                Suggestion · edit before saving
            </p>
            <DraftCardForm draft={draft} onChange={onDraftChange} disabled={creating} />

            <div className="border-t border-base-300 pt-6 space-y-3">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                    Starter checklist
                    {enriching && (
                        <span
                            className="ml-2 text-base-content/40 normal-case"
                            aria-live="polite"
                        >
                            · drafting…
                        </span>
                    )}
                </p>
                <DraftChecklistEditor
                    items={checklist}
                    onChange={onChecklistChange}
                    disabled={creating || enriching}
                />
            </div>

            {labels.length > 0 && (
                <div className="border-t border-base-300 pt-6 space-y-3">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                        Suggested labels · tap to toggle
                    </p>
                    <LabelSuggestionPicker
                        boardId={picker.boardId}
                        suggestions={labels}
                        onChange={onLabelsChange}
                        disabled={creating}
                    />
                </div>
            )}

            <div className="border-t border-base-300 pt-6">
                <BoardListPicker
                    value={picker}
                    onChange={onPickerChange}
                    disabled={creating}
                />
            </div>

            <WorkspaceFooter>
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onDiscard}
                    disabled={creating}
                >
                    Discard
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onCreate}
                    disabled={
                        creating || !draft.title.trim() || !picker.boardId || !picker.listId
                    }
                >
                    {creating ? 'Adding…' : 'Add kata'}
                </button>
            </WorkspaceFooter>
        </div>
    );
}

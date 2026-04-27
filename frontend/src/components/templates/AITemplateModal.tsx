'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
    useGenerateTemplateLists,
    useGenerateTemplateCards,
    useGenerateChecklist,
} from '@/hooks/use-ai';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Field, Textarea } from '@/components/ui';

interface GeneratedCard {
    title: string;
    description?: string;
    priority?: string;
    checklist?: string[];
}

interface GeneratedTemplate {
    board_title: string;
    board_description: string;
    lists: { title: string; cards: GeneratedCard[] }[];
}

type Phase =
    | { kind: 'idle' }
    | { kind: 'lists' }
    | { kind: 'cards' }
    | { kind: 'checklists'; n: number; of: number }
    | { kind: 'applying' };

function progressLabel(phase: Phase): string {
    switch (phase.kind) {
        case 'idle':
            return '';
        case 'lists':
            return 'Drafting workflow stages…';
        case 'cards':
            return 'Drafting starter kata…';
        case 'checklists':
            return `Drafting checklists — ${phase.n} of ${phase.of}`;
        case 'applying':
            return 'Opening the dojo…';
    }
}

export function AITemplateModal({
    open,
    onClose,
    onGenerated,
    isApplying,
}: {
    open: boolean;
    onClose: () => void;
    onGenerated: (result: GeneratedTemplate) => void;
    isApplying: boolean;
}) {
    const [request, setRequest] = useState('');
    const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const toast = useToast();

    const generateLists = useGenerateTemplateLists();
    const generateCards = useGenerateTemplateCards();
    const generateChecklist = useGenerateChecklist();

    const busy = phase.kind !== 'idle' || isApplying;
    const effectivePhase: Phase = isApplying ? { kind: 'applying' } : phase;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    const handleGenerate = async () => {
        if (!request.trim() || busy) return;
        try {
            setPhase({ kind: 'lists' });
            const lists = await generateLists.mutateAsync(request);

            setPhase({ kind: 'cards' });
            const cards = await generateCards.mutateAsync({
                request,
                boardTitle: lists.board_title,
                lists: lists.lists,
            });

            // Pass 3: checklists in parallel — each card gets the model's full
            // attention with only its own context. Failures here don't kill
            // the whole flow; a card with no checklist is fine.
            const cardCount = cards.cards.length;
            let done = 0;
            setPhase({ kind: 'checklists', n: 0, of: cardCount });
            const enrichedCards: GeneratedCard[] = await Promise.all(
                cards.cards.map(async (c) => {
                    try {
                        const cl = await generateChecklist.mutateAsync({
                            title: c.title,
                            description: c.description,
                            priority: c.priority,
                        });
                        return { ...c, checklist: cl.steps };
                    } catch {
                        return c;
                    } finally {
                        done += 1;
                        setPhase({ kind: 'checklists', n: done, of: cardCount });
                    }
                }),
            );

            // Hand off to the apply path. All cards land in the first list;
            // the templates page enforces this regardless.
            const result: GeneratedTemplate = {
                board_title: lists.board_title,
                board_description: lists.board_description,
                lists: lists.lists.map((listTitle, i) => ({
                    title: listTitle,
                    cards: i === 0 ? enrichedCards : [],
                })),
            };
            setPhase({ kind: 'idle' });
            onGenerated(result);
        } catch (err) {
            setPhase({ kind: 'idle' });
            toast.error(getToastErrorMessage(err));
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={onClose}
            onCancel={(e) => {
                // Block Escape mid-generation so the user can't abandon paid calls.
                if (busy) e.preventDefault();
            }}
        >
            <div className="modal-box bg-base-100 rounded-xl shadow-e4 max-w-lg p-8">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    AI · Pro+
                </p>
                <h3
                    id={titleId}
                    className="mt-4 font-display text-3xl font-medium tracking-tight"
                >
                    Generate a <span className="italic text-primary">template.</span>
                </h3>
                <p className="mt-3 text-sm text-base-content/70">
                    Describe the project. The model drafts a board. You decide.
                </p>

                <div className="mt-8">
                    <Field label="Describe it" htmlFor="ai-template-input">
                        <Textarea
                            id="ai-template-input"
                            rows={4}
                            placeholder="A SaaS product launch with marketing, dev, and QA tracks — six weeks end to end"
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            autoFocus
                            disabled={busy}
                        />
                    </Field>
                </div>

                {effectivePhase.kind !== 'idle' && (
                    <p
                        className="mt-6 text-eyebrow font-mono uppercase tracking-widest text-primary"
                        aria-live="polite"
                    >
                        {progressLabel(effectivePhase)}
                    </p>
                )}

                <div className="flex items-center justify-end gap-4 pt-8">
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={!request.trim() || busy}
                    >
                        {busy ? (
                            'Drafting…'
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={faWandMagicSparkles}
                                    aria-hidden="true"
                                    className="mr-2"
                                />
                                Draft the board
                            </>
                        )}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="submit" aria-label="Close" disabled={busy}>
                    close
                </button>
            </form>
        </dialog>
    );
}

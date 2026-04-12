'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useGenerateTemplate } from '@/hooks/use-ai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Field, Textarea } from '@/components/ui';

interface GeneratedList {
    title: string;
    cards: { title: string; description?: string; priority?: string }[];
}

interface GeneratedTemplate {
    board_title: string;
    board_description: string;
    lists: GeneratedList[];
}

// Uses the native <dialog> showModal() API so the browser provides focus
// trap, Escape-to-cancel, body scroll lock, top-layer rendering, and focus
// return to the trigger.
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
    const generate = useGenerateTemplate();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    const busy = generate.isPending || isApplying;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleGenerate = async () => {
        if (!request.trim()) return;
        const result = await generate.mutateAsync({
            templateType: request,
            customRequest: request,
        });
        onGenerated(result);
    };

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={onClose}
            onCancel={(e) => {
                // Block Escape while the model is drafting or the template
                // is being applied so the user can't abandon a paid call.
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
                        />
                    </Field>
                </div>

                <div className="flex items-center justify-end gap-4 pt-8">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
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

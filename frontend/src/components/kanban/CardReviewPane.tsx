'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { CardReviewSuggestions } from '@/hooks/use-review-card';
import type { UpdateCardInput, Priority } from '@kanninja/shared';

type FieldKey = 'description' | 'priority' | 'estimatedHours';
type Status = 'pending' | 'applied' | 'discarded';

interface CardReviewPaneProps {
    suggestions: CardReviewSuggestions;
    current: {
        description: string | null;
        priority: string;
        estimatedHours: string | null;
    };
    onApply: (patch: Partial<UpdateCardInput>) => Promise<void>;
    onBack: () => void;
}

const FIELD_LABELS: Record<FieldKey, string> = {
    description: 'Description',
    priority: 'Priority',
    estimatedHours: 'Estimated hours',
};

function formatCurrent(field: FieldKey, current: CardReviewPaneProps['current']) {
    if (field === 'description') return current.description?.trim() || 'Empty';
    if (field === 'priority')
        return current.priority === 'none'
            ? 'Unset'
            : current.priority.charAt(0).toUpperCase() + current.priority.slice(1);
    if (field === 'estimatedHours')
        return current.estimatedHours ? `${parseFloat(current.estimatedHours)} h` : 'Unset';
    return '';
}

function formatProposed(field: FieldKey, suggestions: CardReviewSuggestions): string {
    if (field === 'description') return suggestions.description?.proposed ?? '';
    if (field === 'priority') {
        const v = suggestions.priority?.proposed;
        return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
    }
    if (field === 'estimatedHours') return `${suggestions.estimatedHours?.proposed ?? ''} h`;
    return '';
}

function buildPatch(field: FieldKey, suggestions: CardReviewSuggestions): Partial<UpdateCardInput> {
    if (field === 'description' && suggestions.description) {
        return { description: suggestions.description.proposed };
    }
    if (field === 'priority' && suggestions.priority) {
        return { priority: suggestions.priority.proposed as Priority };
    }
    if (field === 'estimatedHours' && suggestions.estimatedHours) {
        return { estimatedHours: suggestions.estimatedHours.proposed };
    }
    return {};
}

export function CardReviewPane({ suggestions, current, onApply, onBack }: CardReviewPaneProps) {
    // Sparse suggestions — only fields the model proposed a change for
    // appear here. The order matches the Details tab so the reviewer's
    // eye doesn't jump around.
    const fields = useMemo<FieldKey[]>(
        () =>
            (['description', 'priority', 'estimatedHours'] as const).filter((f) => suggestions[f]),
        [suggestions],
    );

    const [statuses, setStatuses] = useState<Record<FieldKey, Status>>({
        description: 'pending',
        priority: 'pending',
        estimatedHours: 'pending',
    });

    const pendingFields = fields.filter((f) => statuses[f] === 'pending');

    const handleAccept = async (field: FieldKey) => {
        await onApply(buildPatch(field, suggestions));
        setStatuses((s) => ({ ...s, [field]: 'applied' }));
    };

    const handleDiscard = (field: FieldKey) => {
        setStatuses((s) => ({ ...s, [field]: 'discarded' }));
    };

    const handleAcceptAll = async () => {
        const patch = pendingFields.reduce<Partial<UpdateCardInput>>(
            (acc, f) => ({ ...acc, ...buildPatch(f, suggestions) }),
            {},
        );
        await onApply(patch);
        setStatuses((s) => {
            const next = { ...s };
            for (const f of pendingFields) next[f] = 'applied';
            return next;
        });
    };

    if (fields.length === 0) {
        return (
            <div className="space-y-6">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                    Review
                </p>
                <p className="text-base-content/70">
                    Looks solid — nothing to suggest right now.
                </p>
                <button type="button" onClick={onBack} className="btn btn-ghost btn-sm">
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" className="mr-2" />
                    Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-baseline justify-between">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Review · {fields.length} suggestion{fields.length === 1 ? '' : 's'}
                </p>
                {pendingFields.length === 0 && (
                    <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                        All resolved
                    </span>
                )}
            </div>

            <ul className="space-y-6">
                {fields.map((field) => {
                    const status = statuses[field];
                    const reasoning = suggestions[field]?.reasoning ?? '';
                    return (
                        <li
                            key={field}
                            className="border-l-2 border-base-300 pl-5 space-y-3"
                        >
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                {FIELD_LABELS[field]}
                            </p>

                            <div className="space-y-2">
                                <p className="text-xs text-base-content/40">Current</p>
                                <p className="text-sm text-base-content/70 whitespace-pre-wrap">
                                    {formatCurrent(field, current)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs text-primary">Proposed</p>
                                <p className="text-sm text-base-content whitespace-pre-wrap">
                                    {formatProposed(field, suggestions)}
                                </p>
                            </div>

                            <p className="text-xs italic text-base-content/50 leading-relaxed">
                                {reasoning}
                            </p>

                            {status === 'pending' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleDiscard(field)}
                                        className="btn btn-ghost btn-sm text-base-content/60"
                                    >
                                        <FontAwesomeIcon icon={faXmark} aria-hidden="true" className="mr-1.5" />
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAccept(field)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <FontAwesomeIcon icon={faCheck} aria-hidden="true" className="mr-1.5" />
                                        Accept
                                    </button>
                                </div>
                            )}
                            {status === 'applied' && (
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary pt-1">
                                    Applied
                                </p>
                            )}
                            {status === 'discarded' && (
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40 pt-1">
                                    Dismissed
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>

            <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={onBack} className="btn btn-ghost btn-sm">
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" className="mr-2" />
                    Back
                </button>
                {pendingFields.length > 1 && (
                    <button
                        type="button"
                        onClick={handleAcceptAll}
                        className="btn btn-primary btn-sm"
                    >
                        Accept all ({pendingFields.length})
                    </button>
                )}
            </div>
        </div>
    );
}

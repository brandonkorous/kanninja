'use client';

import { useState } from 'react';
import {
    useBoardLabels,
    useCardLabels,
    useCreateLabel,
    useAssignLabel,
    useRemoveLabel,
} from '@/hooks/use-card-features';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

// Hanko semantic palette for labels. Each entry maps to a DaisyUI semantic
// class so labels auto-flip with the theme. No raw hex — the old palette
// used arbitrary tailwind colors (#ef4444 etc.) which violated the voice.
const HANKO_LABEL_COLORS = [
    { key: 'primary', bg: '#E0432F', name: 'Vermillion' },
    { key: 'bamboo', bg: '#3F8F5C', name: 'Bamboo' },
    { key: 'honey', bg: '#D89B2B', name: 'Honey' },
    { key: 'indigo', bg: '#3D5C8A', name: 'Indigo' },
    { key: 'coral', bg: '#F19684', name: 'Coral' },
    { key: 'sumi', bg: '#2A2B33', name: 'Sumi' },
] as const;

export function LabelsTab({ boardId, cardId }: { boardId: string; cardId: string }) {
    const { data: boardLabels } = useBoardLabels(boardId);
    const { data: cardLabels } = useCardLabels(boardId, cardId);
    const createLabel = useCreateLabel();
    const assignLabel = useAssignLabel(boardId, cardId);
    const removeLabel = useRemoveLabel(boardId, cardId);

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [color, setColor] = useState<string>(HANKO_LABEL_COLORS[0].bg);

    const assignedIds = new Set(cardLabels?.map((l) => l.id) ?? []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await createLabel.mutateAsync({ name: name.trim(), color, boardId });
        setName('');
        setShowCreate(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-3">
                    Assigned
                </p>
                {cardLabels?.length === 0 && (
                    <p className="text-sm text-base-content/50">
                        No labels on this kata.
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    {cardLabels?.map((label) => (
                        <button
                            key={label.id}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: label.color }}
                            onClick={() => removeLabel.mutate(label.id)}
                            aria-label={`Remove ${label.name}`}
                        >
                            {label.name}
                            <FontAwesomeIcon
                                icon={faTimes}
                                aria-hidden="true"
                                className="text-[10px]"
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-3">
                    Available
                </p>
                <div className="flex flex-wrap gap-2">
                    {boardLabels
                        ?.filter((l) => !assignedIds.has(l.id))
                        .map((label) => (
                            <button
                                key={label.id}
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: label.color }}
                                onClick={() => assignLabel.mutate(label.id)}
                                aria-label={`Add ${label.name}`}
                            >
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    aria-hidden="true"
                                    className="text-[10px]"
                                />
                                {label.name}
                            </button>
                        ))}
                </div>
            </div>

            {!showCreate ? (
                <button
                    type="button"
                    className="btn btn-outline btn-secondary btn-sm"
                    onClick={() => setShowCreate(true)}
                >
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
                    New label
                </button>
            ) : (
                <form
                    onSubmit={handleCreate}
                    className="space-y-4 bg-base-200 rounded-lg p-4 border border-base-300"
                >
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full focus:shadow-focus"
                        placeholder="Label name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                        {HANKO_LABEL_COLORS.map((c) => (
                            <button
                                key={c.key}
                                type="button"
                                title={c.name}
                                aria-label={c.name}
                                className={`w-7 h-7 rounded-full transition-transform ${
                                    c.bg === color
                                        ? 'ring-2 ring-offset-2 ring-base-content scale-110'
                                        : 'hover:scale-110'
                                }`}
                                style={{ backgroundColor: c.bg }}
                                onClick={() => setColor(c.bg)}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!name.trim()}
                        >
                            Create
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowCreate(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

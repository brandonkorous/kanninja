'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Input } from '@/components/ui';

// Editable list of AI-generated checklist items. Each row: text + remove.
// A bottom row lets the user append a new item. Used by ParseTaskWorkspace
// before the user commits the card. The shape is just `string[]` since
// these items don't exist server-side until the card is created.

export function DraftChecklistEditor({
    items,
    onChange,
    disabled,
}: {
    items: string[];
    onChange: (next: string[]) => void;
    disabled?: boolean;
}) {
    const [pending, setPending] = useState('');

    const update = (i: number, text: string) =>
        onChange(items.map((s, idx) => (idx === i ? text : s)));
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
    const append = () => {
        const trimmed = pending.trim();
        if (!trimmed) return;
        onChange([...items, trimmed]);
        setPending('');
    };

    return (
        <div className="space-y-3">
            {items.length === 0 && (
                <p className="text-xs text-base-content/50 italic">
                    No starter steps. Add one below if you want.
                </p>
            )}
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 group">
                        <span className="font-mono text-xs text-base-content/30 tabular-nums w-6 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <Input
                            size="sm"
                            value={item}
                            onChange={(e) => update(i, e.target.value)}
                            disabled={disabled}
                        />
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            disabled={disabled}
                            aria-label="Remove step"
                            className="text-base-content/30 hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:shadow-focus rounded p-1 shrink-0"
                        >
                            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
            <div className="flex items-center gap-3 pt-1">
                <span className="font-mono text-xs text-base-content/20 tabular-nums w-6 shrink-0">
                    +
                </span>
                <Input
                    size="sm"
                    placeholder="Add a step…"
                    value={pending}
                    onChange={(e) => setPending(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            append();
                        }
                    }}
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={append}
                    disabled={disabled || !pending.trim()}
                    aria-label="Add step"
                    className="text-base-content/40 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-base-content/40 focus-visible:shadow-focus rounded p-1 shrink-0"
                >
                    <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

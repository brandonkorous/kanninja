'use client';

import { useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTag } from '@fortawesome/free-solid-svg-icons';
import { useBoardLabels } from '@/hooks/use-card-features';

// Hanko label palette. Mirror of the constant in LabelsTab — duplicated
// here so this picker stays self-contained. If the palette changes,
// update both. Source order matters for the deterministic hash below.
const PALETTE = [
    '#E0432F', // vermillion
    '#3F8F5C', // bamboo
    '#D89B2B', // honey
    '#3D5C8A', // indigo
    '#F19684', // coral
    '#2A2B33', // sumi
] as const;

function hashColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i += 1) {
        h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return PALETTE[h % PALETTE.length];
}

export interface SuggestedLabel {
    name: string;
    selected: boolean;
    // Set after the board is picked + labels fetched. Empty string = will
    // be created on submit; a UUID = will be reused.
    existingId: string;
    color: string;
}

export function makeSuggestions(tags: string[]): SuggestedLabel[] {
    // Dedupe case-insensitively, drop empties, cap at 6 to keep the row tidy.
    const seen = new Set<string>();
    const out: SuggestedLabel[] = [];
    for (const raw of tags) {
        const name = raw?.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, selected: true, existingId: '', color: hashColor(name) });
        if (out.length >= 6) break;
    }
    return out;
}

export function LabelSuggestionPicker({
    boardId,
    suggestions,
    onChange,
    disabled,
}: {
    boardId: string;
    suggestions: SuggestedLabel[];
    onChange: (next: SuggestedLabel[]) => void;
    disabled?: boolean;
}) {
    const { data: boardLabels } = useBoardLabels(boardId);

    // Whenever the board's labels arrive (or the suggestion set changes),
    // reconcile by name (case-insensitive). Match → reuse the existing
    // label's id and color. No match → keep the suggestion as new.
    const reconciled = useMemo(() => {
        if (!boardLabels) return suggestions;
        const byName = new Map(boardLabels.map((l) => [l.name.toLowerCase(), l]));
        return suggestions.map((s) => {
            const match = byName.get(s.name.toLowerCase());
            if (match) {
                return { ...s, existingId: match.id, color: match.color };
            }
            // No match — make sure existingId is cleared (the user might
            // have changed boards).
            return s.existingId ? { ...s, existingId: '', color: hashColor(s.name) } : s;
        });
    }, [boardLabels, suggestions]);

    // Push reconciliation back up if anything changed. Compared shallowly
    // by id+color since those are the fields reconciliation can rewrite.
    useEffect(() => {
        const drift = reconciled.some((r, i) => {
            const s = suggestions[i];
            return !s || r.existingId !== s.existingId || r.color !== s.color;
        });
        if (drift) onChange(reconciled);
    }, [reconciled, suggestions, onChange]);

    if (suggestions.length === 0) return null;

    const toggle = (i: number) =>
        onChange(
            suggestions.map((s, idx) =>
                idx === i ? { ...s, selected: !s.selected } : s,
            ),
        );

    return (
        <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => {
                const reused = !!s.existingId;
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => toggle(i)}
                        disabled={disabled}
                        aria-pressed={s.selected}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors focus-visible:shadow-focus ${
                            s.selected
                                ? 'border-base-content/20'
                                : 'border-base-300 opacity-50 hover:opacity-100'
                        }`}
                        style={
                            s.selected
                                ? { backgroundColor: `${s.color}1A`, color: s.color }
                                : undefined
                        }
                    >
                        <FontAwesomeIcon
                            icon={s.selected ? faCheck : faTag}
                            aria-hidden="true"
                            className="text-[10px]"
                        />
                        <span>{s.name}</span>
                        {!reused && s.selected && (
                            <span className="font-mono uppercase tracking-wider text-[9px] opacity-60">
                                new
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

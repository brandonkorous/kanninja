'use client';

import type { DecomposedTask } from './DecomposeGoalWorkspace';

const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent']);

function normalizePriority(p?: string): string {
    const lower = p?.toLowerCase().trim();
    return lower && VALID_PRIORITIES.has(lower) ? lower : 'medium';
}

// Read-only roster of suggested kata. Renders the AI's decomposition as a
// numbered list with mono priority + hours meta. Keep this view-only — the
// user's "edit before save" lever is choosing which path (new dojo vs
// existing) and trusting the model's titles, since editing 5–10 cards
// inline would push this page past the threshold of "scan and act."

export function TaskRoster({ tasks }: { tasks: DecomposedTask[] }) {
    return (
        <ol className="space-y-4">
            {tasks.map((t, i) => (
                <li key={i} className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-base-content/30 mt-1 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                        <h4 className="font-display text-lg font-medium tracking-tight">
                            {t.title}
                        </h4>
                        {t.description && (
                            <p className="mt-1 text-sm text-base-content/60 leading-relaxed">
                                {t.description}
                            </p>
                        )}
                        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-base-content/40 space-x-3">
                            <span>{normalizePriority(t.priority)}</span>
                            {typeof t.estimated_hours === 'number' && t.estimated_hours > 0 && (
                                <span>· {t.estimated_hours}h</span>
                            )}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

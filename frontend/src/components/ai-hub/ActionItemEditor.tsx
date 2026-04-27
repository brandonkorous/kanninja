'use client';

import { Input, Select } from '@/components/ui';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export type ActionPriority = (typeof PRIORITIES)[number];

export interface ActionDraft {
    selected: boolean;
    title: string;
    priority: ActionPriority;
    dueDate: string;
}

export function normalizeActionPriority(p?: string): ActionPriority {
    const lower = p?.toLowerCase().trim();
    return PRIORITIES.includes(lower as ActionPriority)
        ? (lower as ActionPriority)
        : 'medium';
}

export function ActionItemEditor({
    drafts,
    onUpdate,
}: {
    drafts: ActionDraft[];
    onUpdate: (i: number, patch: Partial<ActionDraft>) => void;
}) {
    if (drafts.length === 0) {
        return (
            <p className="mt-3 text-sm text-base-content/50 italic">
                No action items found.
            </p>
        );
    }
    return (
        <ul className="mt-4 space-y-4">
            {drafts.map((d, i) => (
                <li
                    key={i}
                    className="flex items-start gap-4 border-l-2 border-base-300 pl-4"
                >
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-2 shrink-0"
                        checked={d.selected}
                        onChange={(e) => onUpdate(i, { selected: e.target.checked })}
                        aria-label={`Include "${d.title}"`}
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
                        <Input
                            size="sm"
                            value={d.title}
                            onChange={(e) => onUpdate(i, { title: e.target.value })}
                            disabled={!d.selected}
                        />
                        <Select
                            size="sm"
                            className="w-32"
                            value={d.priority}
                            onChange={(e) =>
                                onUpdate(i, { priority: e.target.value as ActionPriority })
                            }
                            disabled={!d.selected}
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </Select>
                        <Input
                            size="sm"
                            type="date"
                            className="w-40"
                            value={d.dueDate}
                            onChange={(e) => onUpdate(i, { dueDate: e.target.value })}
                            disabled={!d.selected}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

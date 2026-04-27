'use client';

import { Field, Input, Textarea, Select } from '@/components/ui';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
export type DraftPriority = (typeof PRIORITIES)[number];

export interface DraftCard {
    title: string;
    description: string;
    priority: DraftPriority;
    dueDate: string;
    estimatedHours: string;
}

export function normalizeDraftPriority(p?: string): DraftPriority {
    const lower = p?.toLowerCase().trim();
    return PRIORITIES.includes(lower as DraftPriority)
        ? (lower as DraftPriority)
        : 'medium';
}

export function DraftCardForm({
    draft,
    onChange,
    disabled,
}: {
    draft: DraftCard;
    onChange: (next: DraftCard) => void;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-6">
            <Field label="Title" htmlFor="draft-title">
                <Input
                    id="draft-title"
                    value={draft.title}
                    onChange={(e) => onChange({ ...draft, title: e.target.value })}
                    required
                    disabled={disabled}
                />
            </Field>
            <Field label="Description" htmlFor="draft-desc" optional>
                <Textarea
                    id="draft-desc"
                    rows={3}
                    value={draft.description}
                    onChange={(e) => onChange({ ...draft, description: e.target.value })}
                    disabled={disabled}
                />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Priority" htmlFor="draft-priority">
                    <Select
                        id="draft-priority"
                        value={draft.priority}
                        onChange={(e) =>
                            onChange({ ...draft, priority: e.target.value as DraftPriority })
                        }
                        disabled={disabled}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Due" htmlFor="draft-due" optional>
                    <Input
                        id="draft-due"
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) => onChange({ ...draft, dueDate: e.target.value })}
                        disabled={disabled}
                    />
                </Field>
                <Field label="Hours" htmlFor="draft-hours" optional>
                    <Input
                        id="draft-hours"
                        type="number"
                        min={0}
                        step="0.5"
                        value={draft.estimatedHours}
                        onChange={(e) => onChange({ ...draft, estimatedHours: e.target.value })}
                        disabled={disabled}
                    />
                </Field>
            </div>
        </div>
    );
}

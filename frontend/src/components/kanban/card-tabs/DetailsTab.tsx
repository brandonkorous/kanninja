'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Textarea, Select, Checkbox } from '@/components/ui';
import { useBoardMembers } from '@/hooks/use-board-members';
import { useSuggestStartDate } from '@/hooks/use-suggest-start-date';
import { CardMetadata } from './CardMetadata';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;

export function DetailsTab({
    boardId,
    title,
    description,
    priority,
    startDate,
    dueDate,
    isCompleted,
    assigneeId,
    estimatedHours,
    createdBy,
    createdAt,
    updatedAt,
    onTitleChange,
    onDescriptionChange,
    onPriorityChange,
    onStartDateChange,
    onDueDateChange,
    onCompletedChange,
    onAssigneeChange,
    onEstimatedHoursChange,
    onEstimatedHoursBlur,
    onTitleBlur,
    onDescriptionBlur,
}: {
    boardId: string;
    title: string;
    description: string;
    priority: string;
    startDate: string;
    dueDate: string;
    isCompleted: boolean;
    assigneeId: string | null;
    estimatedHours: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    onTitleChange: (v: string) => void;
    onDescriptionChange: (v: string) => void;
    onPriorityChange: (v: string) => void;
    onStartDateChange: (v: string) => void;
    onDueDateChange: (v: string) => void;
    onCompletedChange: (v: boolean) => void;
    onAssigneeChange: (v: string) => void;
    onEstimatedHoursChange: (v: string) => void;
    onEstimatedHoursBlur?: () => void;
    onTitleBlur?: () => void;
    onDescriptionBlur?: () => void;
}) {
    const { data: members } = useBoardMembers(boardId);
    const suggestStartDate = useSuggestStartDate();

    // Smart-suggest is only useful when there's a dueDate to anchor
    // against and no startDate already set. Disabled while pending.
    const canSuggestStart = !!dueDate && !startDate;
    const handleSuggestStart = async () => {
        if (!canSuggestStart) return;
        const result = await suggestStartDate.mutateAsync({
            title,
            description: description || undefined,
            dueDate: new Date(dueDate).toISOString(),
            estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        });
        // The suggestion comes back as a YYYY-MM-DD-style ISO; trim to
        // the date portion for the <input type="date">. The change
        // handler will commit it through the same path as a manual edit.
        onStartDateChange(result.suggested_start_date.slice(0, 10));
    };

    return (
        <div className="space-y-6">
            <Field label="Title" htmlFor="card-title-input">
                <Input
                    id="card-title-input"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    onBlur={onTitleBlur}
                />
            </Field>
            <Field label="Description" htmlFor="card-desc-input" optional>
                <Textarea
                    id="card-desc-input"
                    rows={4}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    onBlur={onDescriptionBlur}
                    placeholder="What is this kata for?"
                />
            </Field>
            {/* Dates: start + due on the same row so the span reads
              * left-to-right like the timeline bar. The smart-suggest
              * button sits inside the start-date field — only visible
              * when there's a due date to anchor against. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Start date" htmlFor="card-start-input" optional>
                    <div className="flex items-center gap-2">
                        <Input
                            id="card-start-input"
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            className="flex-1"
                        />
                        {canSuggestStart && (
                            <button
                                type="button"
                                onClick={handleSuggestStart}
                                disabled={suggestStartDate.isPending}
                                aria-label="Suggest a start date with AI"
                                title="AI suggests a start date based on the due date, your estimate, and any connected calendar"
                                className="btn btn-ghost btn-sm shrink-0 text-base-content/60 hover:text-primary"
                            >
                                <FontAwesomeIcon
                                    icon={faWandMagicSparkles}
                                    aria-hidden="true"
                                    className={suggestStartDate.isPending ? 'animate-pulse' : ''}
                                />
                                <span className="ml-1.5 hidden md:inline">
                                    {suggestStartDate.isPending ? 'Thinking…' : 'Suggest'}
                                </span>
                            </button>
                        )}
                    </div>
                </Field>
                <Field label="Due date" htmlFor="card-due-input" optional>
                    <Input
                        id="card-due-input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => onDueDateChange(e.target.value)}
                    />
                </Field>
            </div>
            {/* Planning metadata: priority + estimate sit together
              * because both feed the smart-suggest math (and both
              * drive how the kata reads on the calendar/timeline). */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Priority" htmlFor="card-priority-input">
                    <Select
                        id="card-priority-input"
                        value={priority}
                        onChange={(e) => onPriorityChange(e.target.value)}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Estimated hours" htmlFor="card-hours-input" optional>
                    <Input
                        id="card-hours-input"
                        type="number"
                        min="0"
                        step="0.5"
                        value={estimatedHours}
                        onChange={(e) => onEstimatedHoursChange(e.target.value)}
                        onBlur={onEstimatedHoursBlur}
                        placeholder="0"
                    />
                </Field>
            </div>
            <Field label="Assignee" htmlFor="card-assignee-input" optional>
                <Select
                    id="card-assignee-input"
                    value={assigneeId ?? ''}
                    onChange={(e) => onAssigneeChange(e.target.value)}
                >
                    <option value="">Unassigned</option>
                    {members?.map((m) => (
                        <option key={m.userId} value={m.userId}>
                            {m.displayName ?? m.email}
                        </option>
                    ))}
                </Select>
            </Field>
            <Checkbox
                checked={isCompleted}
                onChange={(e) => onCompletedChange(e.target.checked)}
                label={
                    <>
                        <FontAwesomeIcon
                            icon={faCheck}
                            aria-hidden="true"
                            className="mr-2 text-base-content/50"
                        />
                        Seal this kata as done
                    </>
                }
            />
            <CardMetadata
                boardId={boardId}
                createdBy={createdBy}
                createdAt={createdAt}
                updatedAt={updatedAt}
            />
        </div>
    );
}

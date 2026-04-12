'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Field, Input, Textarea, Select, Checkbox } from '@/components/ui';
import { useBoardMembers } from '@/hooks/use-board-members';
import { CardMetadata } from './CardMetadata';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;

export function DetailsTab({
    boardId,
    title,
    description,
    priority,
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
    onDueDateChange: (v: string) => void;
    onCompletedChange: (v: boolean) => void;
    onAssigneeChange: (v: string) => void;
    onEstimatedHoursChange: (v: string) => void;
    onEstimatedHoursBlur?: () => void;
    onTitleBlur?: () => void;
    onDescriptionBlur?: () => void;
}) {
    const { data: members } = useBoardMembers(boardId);

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
                <Field label="Due date" htmlFor="card-due-input" optional>
                    <Input
                        id="card-due-input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => onDueDateChange(e.target.value)}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

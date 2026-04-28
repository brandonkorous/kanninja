'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { DraftCard } from './DraftCardForm';
import type { SuggestedLabel } from './LabelSuggestionPicker';
import type { BoardListSelection } from './BoardListPicker';

function dateToIsoDateTime(d: string): string | undefined {
    if (!d) return undefined;
    const parsed = new Date(`${d}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export interface CreatedCard {
    id: string;
    boardId: string;
    boardTitle?: string;
    listTitle?: string;
}

// The composite create flow for parse-task: insert the card, then in
// parallel insert checklist items and resolve/assign labels. Individual
// child failures don't fail the whole create — the user gets as much
// of their setup as we can land. The card insert itself is the only
// hard requirement; if that throws we surface the error and bail.
export function useParseTaskCreate() {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    const [creating, setCreating] = useState(false);

    const ensureLabel = async (
        label: SuggestedLabel,
        boardId: string,
    ): Promise<string | null> => {
        if (label.existingId) return label.existingId;
        try {
            const res = await api.post<{ data: { id: string } }>('/api/v1/labels', {
                name: label.name,
                color: label.color,
                boardId,
            });
            return res.data.id;
        } catch {
            return null;
        }
    };

    const create = async ({
        draft,
        checklist,
        labels,
        picker,
    }: {
        draft: DraftCard;
        checklist: string[];
        labels: SuggestedLabel[];
        picker: BoardListSelection;
    }): Promise<CreatedCard | null> => {
        if (!picker.listId || creating) return null;
        setCreating(true);
        try {
            const cardRes = await api.post<{ data: { id: string } }>(
                `/api/v1/boards/${picker.boardId}/cards`,
                {
                    listId: picker.listId,
                    title: draft.title.trim(),
                    description: draft.description.trim() || undefined,
                    priority: draft.priority,
                    dueDate: dateToIsoDateTime(draft.dueDate),
                    estimatedHours:
                        draft.estimatedHours && Number(draft.estimatedHours) > 0
                            ? Number(draft.estimatedHours)
                            : undefined,
                },
            );
            const cardId = cardRes.data.id;

            const checklistOps = checklist
                .map((s) => s.trim())
                .filter(Boolean)
                .map((title) =>
                    api
                        .post(
                            `/api/v1/boards/${picker.boardId}/cards/${cardId}/checklist`,
                            { title },
                        )
                        .catch(() => null),
                );
            const labelOps = labels
                .filter((l) => l.selected)
                .map(async (l) => {
                    const labelId = await ensureLabel(l, picker.boardId);
                    if (!labelId) return null;
                    return api
                        .post(
                            `/api/v1/boards/${picker.boardId}/cards/${cardId}/labels`,
                            { labelId },
                        )
                        .catch(() => null);
                });
            await Promise.all([...checklistOps, ...labelOps]);

            qc.invalidateQueries({ queryKey: ['boards', picker.boardId] });
            qc.invalidateQueries({ queryKey: ['scheduled-cards'] });
            qc.invalidateQueries({ queryKey: ['labels', picker.boardId] });
            toast.success(
                `Kata added to ${picker.boardTitle ?? 'dojo'} · ${picker.listTitle ?? 'list'}.`,
            );
            return {
                id: cardId,
                boardId: picker.boardId,
                boardTitle: picker.boardTitle,
                listTitle: picker.listTitle,
            };
        } catch (err) {
            toast.error(getToastErrorMessage(err));
            return null;
        } finally {
            setCreating(false);
        }
    };

    return { create, creating };
}

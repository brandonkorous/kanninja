'use client';

import { useEffect, useMemo } from 'react';
import { useBoards, useBoard } from '@/hooks/use-boards';
import { Field, Select } from '@/components/ui';

// Cascading board → list picker. Used by every AI Hub workspace that
// turns a suggestion into real cards. Auto-selects first writable board
// + first list so the common path is one less click.

export interface BoardListSelection {
    boardId: string;
    listId: string;
    boardTitle?: string;
    listTitle?: string;
}

const WRITABLE_ROLES = new Set(['owner', 'admin', 'editor']);

export function BoardListPicker({
    value,
    onChange,
    boardLabel = 'Dojo',
    listLabel = 'List',
    disabled,
}: {
    value: BoardListSelection;
    onChange: (next: BoardListSelection) => void;
    boardLabel?: string;
    listLabel?: string;
    disabled?: boolean;
}) {
    const { data: boards } = useBoards();
    const { data: board } = useBoard(value.boardId);

    const writableBoards = useMemo(
        () => boards?.filter((b) => WRITABLE_ROLES.has(b.role)) ?? [],
        [boards],
    );

    // Auto-select first writable board on mount once they load.
    useEffect(() => {
        if (!value.boardId && writableBoards.length > 0) {
            const first = writableBoards[0];
            onChange({ boardId: first.id, listId: '', boardTitle: first.title });
        }
    }, [writableBoards, value.boardId, onChange]);

    // Auto-select first list once a board's lists arrive (and only if the
    // current listId isn't already valid for this board — switching boards
    // resets list).
    useEffect(() => {
        if (!board?.lists?.length) return;
        const currentValid = board.lists.some((l) => l.id === value.listId);
        if (!currentValid) {
            const first = board.lists[0];
            onChange({
                boardId: value.boardId,
                listId: first.id,
                boardTitle: board.title,
                listTitle: first.title,
            });
        } else {
            // Keep titles in sync (board.title might arrive after board pick).
            const list = board.lists.find((l) => l.id === value.listId);
            if (list && (value.boardTitle !== board.title || value.listTitle !== list.title)) {
                onChange({
                    boardId: value.boardId,
                    listId: value.listId,
                    boardTitle: board.title,
                    listTitle: list.title,
                });
            }
        }
    }, [board, value.listId, value.boardId, value.boardTitle, value.listTitle, onChange]);

    const handleBoardChange = (boardId: string) => {
        const picked = writableBoards.find((b) => b.id === boardId);
        onChange({ boardId, listId: '', boardTitle: picked?.title });
    };

    const handleListChange = (listId: string) => {
        const picked = board?.lists.find((l) => l.id === listId);
        onChange({
            boardId: value.boardId,
            listId,
            boardTitle: board?.title ?? value.boardTitle,
            listTitle: picked?.title,
        });
    };

    if (!boards) {
        return (
            <p className="text-xs text-base-content/50 italic">
                Loading dojos…
            </p>
        );
    }

    if (writableBoards.length === 0) {
        return (
            <p className="text-xs text-base-content/60 border-l-2 border-base-300 pl-3">
                No dojos you can edit. Open one first, then come back.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={boardLabel} htmlFor="ai-picker-board">
                <Select
                    id="ai-picker-board"
                    value={value.boardId}
                    onChange={(e) => handleBoardChange(e.target.value)}
                    disabled={disabled}
                >
                    {writableBoards.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.title}
                        </option>
                    ))}
                </Select>
            </Field>
            <Field label={listLabel} htmlFor="ai-picker-list">
                <Select
                    id="ai-picker-list"
                    value={value.listId}
                    onChange={(e) => handleListChange(e.target.value)}
                    disabled={disabled || !board?.lists?.length}
                >
                    {!board?.lists?.length && <option value="">—</option>}
                    {board?.lists.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.title}
                        </option>
                    ))}
                </Select>
            </Field>
        </div>
    );
}

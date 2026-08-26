'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisV,
  faTrash,
  faGripVertical,
  faArrowLeft,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu } from '@/components/ui/menu';
import { ColumnTitle } from './ColumnTitle';
import { useUpdateList, useDeleteList } from '@/hooks/use-lists';
import { useDojoPermissions } from '@/hooks/use-permissions';

interface Props {
  id: string;
  boardId: string;
  title: string;
  allSealed: boolean;
  cardsCount: number;
  /** dnd-kit sortable listeners, spread onto the grip. Only the grip
   *  drags the column, so the title stays click-to-edit and the overflow
   *  menu stays clickable. */
  dragHandleProps: Record<string, unknown>;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirstColumn: boolean;
  isLastColumn: boolean;
}

// Column header: drag grip, inline-edit title, and the overflow menu.
// Reads canEdit from the shared useDojoPermissions hook — no prop
// drilling, per the pattern established in KanbanCard + CardDetailModal.
export function KanbanColumnHeader({
  id,
  boardId,
  title,
  allSealed,
  cardsCount,
  dragHandleProps,
  onMoveLeft,
  onMoveRight,
  isFirstColumn,
  isLastColumn,
}: Props) {
  const { canEdit } = useDojoPermissions(boardId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateList = useUpdateList(boardId);
  const deleteList = useDeleteList(boardId);

  const handleConfirmDelete = async () => {
    await deleteList.mutateAsync(id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-1 pr-3 py-3">
        {canEdit && (
          /* Pointer-only affordance, hidden from the a11y tree: keyboard
           * and screen-reader users reorder through Move left / Move
           * right in the menu below. A span rather than a button so it
           * never becomes a focusable control that does nothing on Enter. */
          <span
            {...dragHandleProps}
            aria-hidden="true"
            className="shrink-0 px-1 py-2 -ml-1 cursor-grab active:cursor-grabbing text-base-content/20 hover:text-base-content/60 transition-colors touch-none"
          >
            <FontAwesomeIcon icon={faGripVertical} />
          </span>
        )}

        <ColumnTitle
          title={title}
          canEdit={canEdit}
          allSealed={allSealed}
          cardsCount={cardsCount}
          onSave={(next) => updateList.mutateAsync({ listId: id, title: next })}
        />

        {canEdit && (
          <Menu
            trigger={
              <button
                type="button"
                aria-label="List options"
                className="btn btn-ghost btn-sm md:btn-xs"
              >
                <FontAwesomeIcon icon={faEllipsisV} aria-hidden="true" />
              </button>
            }
          >
            <Menu.Item icon={faArrowLeft} onClick={onMoveLeft} disabled={isFirstColumn}>
              Move left
            </Menu.Item>
            <Menu.Item icon={faArrowRight} onClick={onMoveRight} disabled={isLastColumn}>
              Move right
            </Menu.Item>
            <Menu.Item
              icon={faTrash}
              onClick={() => setShowDeleteDialog(true)}
              destructive
            >
              Delete
            </Menu.Item>
          </Menu>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        eyebrow="Delete list"
        title="Delete this list?"
        body={
          <>
            &ldquo;{title}&rdquo; and every kata it holds will be deleted. There
            is no undo.
          </>
        }
        confirmLabel="Delete list"
        isConfirming={deleteList.isPending}
      />
    </>
  );
}

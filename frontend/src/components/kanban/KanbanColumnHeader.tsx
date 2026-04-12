'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisV,
  faTrash,
  faPen,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu } from '@/components/ui/menu';
import { useUpdateList, useDeleteList } from '@/hooks/use-lists';
import { useDojoPermissions } from '@/hooks/use-permissions';

interface Props {
  id: string;
  boardId: string;
  title: string;
  allSealed: boolean;
  cardsCount: number;
}

// Column header with inline-edit title per Hanko editing-patterns.md.
// Extracted from KanbanColumn.tsx so that file stays under the 200-line
// cap. Owns its own edit + delete state because both are header-local
// concerns that shouldn't leak into the card-rendering parent. Reads
// canEdit from the shared useDojoPermissions hook — no prop drilling,
// per the pattern established in KanbanCard + CardDetailModal.
export function KanbanColumnHeader({
  id,
  boardId,
  title,
  allSealed,
  cardsCount,
}: Props) {
  const { canEdit } = useDojoPermissions(boardId);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateList = useUpdateList(boardId);
  const deleteList = useDeleteList(boardId);

  const handleRenameList = async () => {
    if (editTitle.trim() && editTitle !== title) {
      await updateList.mutateAsync({ listId: id, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    await deleteList.mutateAsync(id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between pr-3 py-3">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <input
              className="input input-sm input-bordered flex-1 text-eyebrow font-mono uppercase tracking-widest focus:shadow-focus"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameList}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameList();
                if (e.key === 'Escape') {
                  setEditTitle(title);
                  setIsEditing(false);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              aria-label="Save list title"
              className="btn btn-ghost btn-sm btn-square shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRenameList}
            >
              <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            </button>
          </div>
        ) : canEdit ? (
          <h3
            role="button"
            tabIndex={0}
            aria-label={`Edit list title: ${title}`}
            className="group text-eyebrow font-mono uppercase tracking-widest text-base-content/70 flex items-center gap-3 cursor-pointer focus-visible:shadow-focus focus-visible:outline-none rounded-sm"
            onClick={() => {
              setEditTitle(title);
              setIsEditing(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEditTitle(title);
                setIsEditing(true);
              }
            }}
          >
            {title}
            <FontAwesomeIcon
              icon={faPen}
              aria-hidden="true"
              className="text-xs text-base-content/20 group-hover:text-primary transition-colors"
            />
            <span
              className={`badge badge-sm ${allSealed ? 'badge-primary' : 'badge-ghost'}`}
              aria-label={allSealed ? `${cardsCount} sealed` : undefined}
            >
              {cardsCount}
            </span>
          </h3>
        ) : (
          <h3 className="text-eyebrow font-mono uppercase tracking-widest text-base-content/70 flex items-center gap-3">
            {title}
            <span
              className={`badge badge-sm ${allSealed ? 'badge-primary' : 'badge-ghost'}`}
              aria-label={allSealed ? `${cardsCount} sealed` : undefined}
            >
              {cardsCount}
            </span>
          </h3>
        )}
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

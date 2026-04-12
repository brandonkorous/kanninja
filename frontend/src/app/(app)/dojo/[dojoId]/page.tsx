'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoard, useUpdateBoard } from '@/hooks/use-boards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useRealtimeBoard } from '@/hooks/use-realtime-board';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { BoardPresence } from '@/components/realtime/BoardPresence';
import { DojoSettingsDialog } from '@/components/board/DojoSettingsDialog';
import { InlineEditTitle } from '@/components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGear } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function BoardPage() {
  const params = useParams();
  const boardId = params.dojoId as string;
  const { data: board, isLoading, error } = useBoard(boardId);
  const updateBoard = useUpdateBoard(boardId);
  const { presenceUsers, status: realtimeStatus } = useRealtimeBoard(boardId);
  // Editors + owners may modify the dojo; viewers cannot. Read straight
  // from the cached useBoard query so all kanban descendants get the
  // same answer without prop drilling.
  const { canEdit } = useDojoPermissions(boardId);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const selectedCard = board?.lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === selectedCardId) ?? null;

  if (isLoading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Opening the dojo…
      </p>
    );
  }

  if (error || !board) {
    return (
      <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
          Sealed
        </p>
        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
          This dojo is <span className="italic text-primary">sealed.</span>
        </h2>
        <p className="mt-3 text-sm text-base-content/60">
          You may not have access, or the dojo no longer exists.
        </p>
        <Link href="/dashboard" className="btn btn-outline btn-secondary mt-8">
          Back to your dojos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header — single horizontal row, designed to be out of
        * the way. Back arrow + title on the left, role/presence/gear
        * on the right. Description lives in the gear settings dialog,
        * not on the working surface. */}
      <header className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dojos"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content shrink-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          </Link>
          <InlineEditTitle
            value={board.title}
            canEdit={canEdit}
            entityLabel="dojo title"
            size="md"
            onSave={(title) => updateBoard.mutateAsync({ title })}
          />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:inline text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
            {board.currentUserRole}
          </span>
          <BoardPresence users={presenceUsers} status={realtimeStatus} />
          <button
            type="button"
            aria-label="Dojo settings"
            aria-haspopup="dialog"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content"
            onClick={() => setShowSettings(true)}
          >
            <FontAwesomeIcon icon={faGear} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Kanban board — full canvas, nothing competing for space */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          boardId={boardId}
          lists={board.lists}
          onCardClick={(cardId) => setSelectedCardId(cardId)}
        />
      </div>

      <DojoSettingsDialog
        boardId={boardId}
        boardTitle={board.title}
        boardDescription={board.description}
        isCreator={board.isCreator}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Card detail modal */}
      <CardDetailModal
        boardId={boardId}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}

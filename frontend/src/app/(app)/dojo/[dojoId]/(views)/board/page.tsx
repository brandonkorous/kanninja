'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoard } from '@/hooks/use-boards';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';

/**
 * Kanban view of the dojo. Layout chrome (header, role badge,
 * presence, settings, view tabs) lives in the parent
 * `(views)/layout.tsx` — this leaf only renders the board surface
 * and owns the card-detail modal so clicking a card here doesn't
 * leak modal state to the calendar / timeline / list siblings.
 */
export default function DojoBoardPage() {
  const params = useParams();
  const boardId = params.dojoId as string;
  const { data: board } = useBoard(boardId);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard =
    board?.lists.flatMap((l) => l.cards).find((c) => c.id === selectedCardId) ?? null;

  if (!board) return null;

  return (
    <>
      <KanbanBoard
        boardId={boardId}
        lists={board.lists}
        onCardClick={(cardId) => setSelectedCardId(cardId)}
      />
      <CardDetailModal
        boardId={boardId}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </>
  );
}

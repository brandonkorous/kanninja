'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useBoard } from '@/hooks/use-boards';
import { useDojoPermissions } from '@/hooks/use-permissions';
import {
  useBoardScheduledCards,
  useRescheduleCard,
  type ScheduledCard,
} from '@/hooks/use-scheduled-cards';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { UnscheduledCardsSidebar } from '@/components/views/UnscheduledCardsSidebar';
import { shiftCardDates, startOfDay } from '@/lib/calendar-dates';
import {
  buildWindow,
  shiftWindow,
  windowDays,
  windowRange,
  type TimelineZoom,
} from '@/lib/timeline-dates';
import { TimelineHeader } from './TimelineHeader';
import { TimelineAxis } from './TimelineAxis';
import { TimelineRow } from './TimelineRow';

const LANE_GUTTER = '10rem';

interface TimelineViewProps {
  boardId: string;
}

/**
 * Gantt-style timeline. Each kanban list is a lane; cards render as
 * bars across their startDate→dueDate span. Drag-to-reschedule
 * preserves the span via the same shiftCardDates helper the calendar
 * uses, so a 3-day kata stays 3 days after the drag — single PATCH.
 *
 * MVP scope: week + month zoom, drag-to-move (no edge-resize yet),
 * group-by-list. Edge resize, group-by-assignee, and quarter zoom
 * land in a polish pass.
 */
export function TimelineView({ boardId }: TimelineViewProps) {
  const [zoom, setZoom] = useState<TimelineZoom>('month');
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const win = useMemo(() => buildWindow(windowStart, zoom), [windowStart, zoom]);
  const days = useMemo(() => windowDays(win), [win]);
  const range = useMemo(() => windowRange(win), [win]);

  const { data: board } = useBoard(boardId);
  const { canEdit } = useDojoPermissions(boardId);
  const { data, isLoading } = useBoardScheduledCards(boardId, {
    ...range,
    unscheduled: true,
  });
  const reschedule = useRescheduleCard();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Group scheduled cards by listId for lane assignment. Cards
  // without dates aren't in `scheduled`, so this only includes the
  // cards we'll actually render as bars.
  const cardsByList = useMemo(() => {
    const map = new Map<string, ScheduledCard[]>();
    for (const card of data?.scheduled ?? []) {
      const existing = map.get(card.listId) ?? [];
      existing.push(card);
      map.set(card.listId, existing);
    }
    return map;
  }, [data]);

  const selectedCard =
    board?.lists.flatMap((l) => l.cards).find((c) => c.id === selectedCardId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.data.current?.type !== 'timeline-day') return;

    const targetDay = new Date(over.data.current.day as string);
    const sourceType = active.data.current?.type;
    const card = active.data.current?.card as ScheduledCard | undefined;
    if (!card) return;

    if (sourceType === 'timeline-card') {
      const fromDay = new Date(active.data.current?.fromDay as string);
      const update = shiftCardDates(card, fromDay, targetDay);
      reschedule.mutate({ cardId: card.id, boardId: card.boardId, ...update });
    } else if (sourceType === 'unscheduled-card') {
      // Schedule unscheduled card with dueDate only — startDate stays
      // null so the smart-suggest endpoint has something to fill in
      // later if the user invokes it.
      const anchored = new Date(targetDay);
      anchored.setHours(12, 0, 0, 0);
      reschedule.mutate({
        cardId: card.id,
        boardId: card.boardId,
        dueDate: anchored.toISOString(),
      });
    }
  };

  const handleZoomChange = (next: TimelineZoom) => {
    setZoom(next);
    // Re-anchor the window on today when changing zoom so the user
    // doesn't end up looking at an arbitrary stretch of empty grid.
    setWindowStart(startOfDay(new Date()));
  };

  if (isLoading || !board) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Reading the dojo…
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col min-w-0">
          <TimelineHeader
            win={win}
            zoom={zoom}
            unscheduledCount={data?.unscheduled.length ?? 0}
            isSidebarOpen={isSidebarOpen}
            onPrev={() => setWindowStart(shiftWindow(win, -1).start)}
            onNext={() => setWindowStart(shiftWindow(win, 1).start)}
            onToday={() => setWindowStart(startOfDay(new Date()))}
            onZoomChange={handleZoomChange}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          />

          <div className="flex-1 overflow-auto border border-base-300 rounded-md">
            <TimelineAxis days={days} laneGutterWidth={LANE_GUTTER} />
            {board.lists.map((list) => (
              <TimelineRow
                key={list.id}
                laneId={list.id}
                laneTitle={list.title}
                cards={cardsByList.get(list.id) ?? []}
                win={win}
                days={days}
                laneGutterWidth={LANE_GUTTER}
                canEdit={canEdit}
                onCardClick={setSelectedCardId}
              />
            ))}
          </div>
        </div>

        <UnscheduledCardsSidebar
          cards={data?.unscheduled ?? []}
          isOpen={isSidebarOpen}
          canEdit={canEdit}
          onCardClick={setSelectedCardId}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <CardDetailModal
        boardId={boardId}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </DndContext>
  );
}

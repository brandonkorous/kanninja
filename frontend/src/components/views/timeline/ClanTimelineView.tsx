'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  useClanScheduledCards,
  useRescheduleCard,
  type ScheduledCard,
} from '@/hooks/use-scheduled-cards';
import { useClanPermissions } from '@/hooks/use-permissions';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { UnscheduledCardsSidebar } from '@/components/views/UnscheduledCardsSidebar';
import { resizeCardDates, shiftCardDates, startOfDay } from '@/lib/calendar-dates';
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
import { FilterBar } from '@/components/views/FilterBar';
import { applyFilters, emptyFilters, type CardFilters } from '@/lib/card-filters';
import { ClanQuickAddCardDialog } from '@/components/views/ClanQuickAddCardDialog';

const LANE_GUTTER = '12rem';

interface ClanTimelineViewProps {
  clanId: string;
}

interface DojoLane {
  boardId: string;
  boardTitle: string;
  cards: ScheduledCard[];
}

/**
 * Clan-aggregated timeline. Lanes are dojos (one row per board the
 * clan can see, that the user is also a member of) — different from
 * the dojo timeline where lanes are kanban lists. The bar's dojo
 * color stripe gives a consistent visual signal even within a row.
 */
export function ClanTimelineView({ clanId }: ClanTimelineViewProps) {
  const [zoom, setZoom] = useState<TimelineZoom>('month');
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<CardFilters>(emptyFilters);
  const [quickAddBoardId, setQuickAddBoardId] = useState<string | null>(null);

  const win = useMemo(() => buildWindow(windowStart, zoom), [windowStart, zoom]);
  const days = useMemo(() => windowDays(win), [win]);
  const range = useMemo(() => windowRange(win), [win]);

  const { data, isLoading } = useClanScheduledCards(clanId, {
    ...range,
    unscheduled: true,
  });

  const filteredScheduled = useMemo(
    () => applyFilters(data?.scheduled ?? [], filters),
    [data?.scheduled, filters],
  );
  const filteredUnscheduled = useMemo(
    () => applyFilters(data?.unscheduled ?? [], filters),
    [data?.unscheduled, filters],
  );
  const { role: clanRole } = useClanPermissions(clanId);
  const canEdit = clanRole === 'admin' || clanRole === 'member';
  const reschedule = useRescheduleCard();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Group scheduled cards by boardId to form one lane per dojo. Sort
  // lanes alphabetically by title so the order is predictable across
  // visits (otherwise lane order would shift with the data).
  const lanes = useMemo<DojoLane[]>(() => {
    const map = new Map<string, DojoLane>();
    for (const card of filteredScheduled) {
      const lane = map.get(card.boardId);
      if (lane) {
        lane.cards.push(card);
      } else {
        map.set(card.boardId, {
          boardId: card.boardId,
          boardTitle: card.boardTitle,
          cards: [card],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.boardTitle.localeCompare(b.boardTitle));
  }, [filteredScheduled]);

  const allCards = [...(data?.scheduled ?? []), ...(data?.unscheduled ?? [])];
  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.data.current?.type !== 'timeline-day') return;

    const targetDay = new Date(over.data.current.day as string);
    const sourceType = active.data.current?.type;
    const card = active.data.current?.card as ScheduledCard | undefined;
    if (!card || sourceType !== 'timeline-card') return;

    const fromDay = new Date(active.data.current?.fromDay as string);
    const update = shiftCardDates(card, fromDay, targetDay);
    reschedule.mutate({ cardId: card.id, boardId: card.boardId, ...update });
  };

  const handleResize = (cardId: string, edge: 'start' | 'end', deltaDays: number) => {
    const card = filteredScheduled.find((c) => c.id === cardId);
    if (!card) return;
    const update = resizeCardDates(card, edge, deltaDays);
    if (!update) return;
    reschedule.mutate({ cardId, boardId: card.boardId, ...update });
  };

  const handleZoomChange = (next: TimelineZoom) => {
    setZoom(next);
    setWindowStart(startOfDay(new Date()));
  };

  if (isLoading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Reading the clan&rsquo;s dojos…
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
            unscheduledCount={filteredUnscheduled.length}
            isSidebarOpen={isSidebarOpen}
            onPrev={() => setWindowStart(shiftWindow(win, -1).start)}
            onNext={() => setWindowStart(shiftWindow(win, 1).start)}
            onToday={() => setWindowStart(startOfDay(new Date()))}
            onZoomChange={handleZoomChange}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          />
          <FilterBar filters={filters} onChange={setFilters} />

          <div className="flex-1 overflow-auto border border-base-300 rounded-md">
            <TimelineAxis days={days} laneGutterWidth={LANE_GUTTER} />
            {lanes.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-base-content/50 italic">
                No scheduled kata in this window.
              </p>
            ) : (
              lanes.map((lane) => (
                <TimelineRow
                  key={lane.boardId}
                  laneId={lane.boardId}
                  laneTitle={lane.boardTitle}
                  cards={lane.cards}
                  win={win}
                  days={days}
                  laneGutterWidth={LANE_GUTTER}
                  canEdit={canEdit}
                  onCardClick={setSelectedCardId}
                  dojoAccent
                  onResize={handleResize}
                  onAddClick={canEdit ? (laneId) => setQuickAddBoardId(laneId) : undefined}
                />
              ))
            )}
          </div>
        </div>

        <UnscheduledCardsSidebar
          cards={filteredUnscheduled}
          isOpen={isSidebarOpen}
          canEdit={false}
          onCardClick={setSelectedCardId}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <CardDetailModal
        boardId={selectedCard?.boardId ?? ''}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />

      <ClanQuickAddCardDialog
        open={!!quickAddBoardId}
        onClose={() => setQuickAddBoardId(null)}
        clanId={clanId}
        defaultBoardId={quickAddBoardId ?? undefined}
      />
    </DndContext>
  );
}

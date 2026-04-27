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
import {
  addMonths,
  cardOverlapsDay,
  localDateKey,
  monthGridDays,
  monthGridRange,
  shiftCardDates,
  startOfMonth,
} from '@/lib/calendar-dates';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDayCell } from './CalendarDayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ClanCalendarViewProps {
  clanId: string;
}

/**
 * Clan-aggregated calendar. Identical mechanics to the dojo calendar
 * (range fetch, drag-to-reschedule, span-aware card placement) but
 * pulls from the clan endpoint and tags each pill with a dojo-color
 * stripe so cross-dojo cards are visually distinguishable.
 *
 * The reschedule mutation routes through the source card's boardId
 * — the API is per-board even though the read aggregates. Drag-from-
 * sidebar on a clan calendar requires a target dojo too; for MVP we
 * only allow rescheduling cards that already have a board (drag
 * within calendar). Sidebar drops are ignored until the dojo-picker
 * UX lands in Phase 8.
 */
export function ClanCalendarView({ clanId }: ClanCalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const range = useMemo(() => monthGridRange(month), [month]);
  const { data, isLoading } = useClanScheduledCards(clanId, {
    ...range,
    unscheduled: true,
  });
  // Clan readers can't reschedule from a clan view. Per-board
  // ceiling enforcement still happens server-side; this just hides
  // the affordance for users who definitely can't edit anything.
  const { role: clanRole } = useClanPermissions(clanId);
  const canEdit = clanRole === 'admin' || clanRole === 'member';
  // boardId travels with each mutation since clan views span boards.
  const reschedule = useRescheduleCard();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => monthGridDays(month), [month]);

  const cardsByDay = useMemo(() => {
    const map = new Map<string, ScheduledCard[]>();
    if (!data?.scheduled) return map;
    for (const day of days) {
      const matches = data.scheduled.filter((c) => cardOverlapsDay(c, day));
      if (matches.length) map.set(localDateKey(day), matches);
    }
    return map;
  }, [days, data]);

  const allCards = [...(data?.scheduled ?? []), ...(data?.unscheduled ?? [])];
  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.data.current?.type !== 'calendar-day') return;

    const targetDay = new Date(over.data.current.day as string);
    const sourceType = active.data.current?.type;
    const card = active.data.current?.card as ScheduledCard | undefined;
    if (!card || sourceType !== 'calendar-card') return;

    const fromDay = new Date(active.data.current?.fromDay as string);
    const update = shiftCardDates(card, fromDay, targetDay);
    reschedule.mutate({ cardId: card.id, boardId: card.boardId, ...update });
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
          <CalendarHeader
            month={month}
            unscheduledCount={data?.unscheduled.length ?? 0}
            isSidebarOpen={isSidebarOpen}
            onPrev={() => setMonth(addMonths(month, -1))}
            onNext={() => setMonth(addMonths(month, 1))}
            onToday={() => setMonth(startOfMonth(new Date()))}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          />

          <div className="grid grid-cols-7 border-l border-t border-base-300 rounded-t-md overflow-hidden">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 border-r border-b border-base-300 bg-base-200/60 text-eyebrow font-mono uppercase tracking-widest text-base-content/50"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-l border-base-300 flex-1 overflow-y-auto">
            {days.map((day) => (
              <CalendarDayCell
                key={day.toISOString()}
                day={day}
                cards={cardsByDay.get(localDateKey(day)) ?? []}
                isCurrentMonth={day.getMonth() === month.getMonth()}
                canEdit={canEdit}
                onCardClick={setSelectedCardId}
                dojoAccent
              />
            ))}
          </div>
        </div>

        <UnscheduledCardsSidebar
          cards={data?.unscheduled ?? []}
          isOpen={isSidebarOpen}
          canEdit={false /* clan-level drag-from-sidebar needs a dojo picker — Phase 8 */}
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
    </DndContext>
  );
}

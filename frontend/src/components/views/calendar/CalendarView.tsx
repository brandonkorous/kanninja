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

interface CalendarViewProps {
  boardId: string;
}

/**
 * Month-grid calendar with drag-to-reschedule. Card positions are
 * derived from cardOverlapsDay (span-aware), so a 3-day kata renders
 * a pill on each of the 3 days. Dragging a pill calls
 * shiftCardDates which preserves the span — atomic single-PATCH so a
 * dragged kata doesn't briefly look split during the round-trip.
 *
 * Sidebar drag is the path for scheduling unscheduled kata: drop on
 * a day to set its dueDate to that day. The card's startDate stays
 * null unless the user later edits it or the AI suggest endpoint is
 * invoked.
 */
export function CalendarView({ boardId }: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: board } = useBoard(boardId);
  const { canEdit } = useDojoPermissions(boardId);
  const range = useMemo(() => monthGridRange(month), [month]);
  const { data, isLoading } = useBoardScheduledCards(boardId, {
    ...range,
    unscheduled: true,
  });
  const reschedule = useRescheduleCard();

  // dnd-kit's PointerSensor needs an activation distance so a quick
  // click on a pill doesn't trigger a drag — same pattern the kanban
  // uses to keep card-click and card-drag distinct gestures.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => monthGridDays(month), [month]);

  // Index cards onto the days they overlap. Done once per data
  // change rather than per-cell to keep the inner render loop O(1)
  // instead of O(cards × cells). Local-date keys so the lookup in
  // the render loop can use the same key without reaching back into
  // cardOverlapsDay for every cell.
  const cardsByDay = useMemo(() => {
    const map = new Map<string, ScheduledCard[]>();
    if (!data?.scheduled) return map;
    for (const day of days) {
      const matches = data.scheduled.filter((c) => cardOverlapsDay(c, day));
      if (matches.length) map.set(localDateKey(day), matches);
    }
    return map;
  }, [days, data]);

  const selectedCard =
    board?.lists.flatMap((l) => l.cards).find((c) => c.id === selectedCardId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.data.current?.type !== 'calendar-day') return;

    const targetDay = new Date(over.data.current.day as string);
    const sourceType = active.data.current?.type;
    const card = active.data.current?.card as ScheduledCard | undefined;
    if (!card) return;

    if (sourceType === 'calendar-card') {
      const fromDay = new Date(active.data.current?.fromDay as string);
      const update = shiftCardDates(card, fromDay, targetDay);
      reschedule.mutate({ cardId: card.id, boardId: card.boardId, ...update });
    } else if (sourceType === 'unscheduled-card') {
      // Anchor newly-scheduled card at noon local time so it sits
      // unambiguously on the target day regardless of the user's
      // timezone. No startDate — they can set one later.
      const anchored = new Date(targetDay);
      anchored.setHours(12, 0, 0, 0);
      reschedule.mutate({
        cardId: card.id,
        boardId: card.boardId,
        dueDate: anchored.toISOString(),
      });
    }
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

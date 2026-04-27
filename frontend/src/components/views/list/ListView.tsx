'use client';

import { useMemo, useState } from 'react';
import {
  faBolt,
  faCalendarDay,
  faCalendarWeek,
  faCalendarPlus,
  faInbox,
  faListUl,
} from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useBoard } from '@/hooks/use-boards';
import { useBoardMembers } from '@/hooks/use-board-members';
import { useBoardLabels } from '@/hooks/card-features/use-labels';
import { useDojoPermissions } from '@/hooks/use-permissions';
import { useBoardScheduledCards, type ScheduledCard } from '@/hooks/use-scheduled-cards';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { FilterBar } from '@/components/views/FilterBar';
import { QuickAddCardDialog } from '@/components/views/QuickAddCardDialog';
import { addDays, localDateKey } from '@/lib/calendar-dates';
import { dueDateKey } from '@/lib/due-dates';
import { applyFilters, emptyFilters, type CardFilters } from '@/lib/card-filters';
import { ListSection } from './ListSection';

type GroupMode = 'date' | 'list';

interface ListViewProps {
  boardId: string;
}

interface DateBuckets {
  overdue: ScheduledCard[];
  today: ScheduledCard[];
  thisWeek: ScheduledCard[];
  later: ScheduledCard[];
  noDate: ScheduledCard[];
}

function bucketByDate(scheduled: ScheduledCard[], unscheduled: ScheduledCard[]): DateBuckets {
  // Date-only keys throughout — see lib/due-dates for why dueDate is
  // a date-only label even though it's stored as a timestamp.
  const todayKey = localDateKey(new Date());
  const weekEndKey = localDateKey(addDays(new Date(), 7));

  const buckets: DateBuckets = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    noDate: [...unscheduled],
  };

  for (const card of scheduled) {
    const key = dueDateKey(card.dueDate);
    if (!key) {
      // Has only startDate — no clear bucket; treat as later for now.
      buckets.later.push(card);
      continue;
    }
    if (!card.isCompleted && key < todayKey) buckets.overdue.push(card);
    else if (key === todayKey) buckets.today.push(card);
    else if (key > todayKey && key <= weekEndKey) buckets.thisWeek.push(card);
    else buckets.later.push(card);
  }

  // Sort each bucket: incomplete first, then by due date ascending.
  for (const k of ['overdue', 'today', 'thisWeek', 'later'] as const) {
    buckets[k].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const aKey = dueDateKey(a.dueDate) ?? '￿';
      const bKey = dueDateKey(b.dueDate) ?? '￿';
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });
  }
  return buckets;
}

/**
 * The List view orchestrator. Default sort: due date ascending with
 * overdue pinned to the top — what mobile users actually want when
 * they pull this up between tasks. Toggle to "By list" to preserve
 * the kanban column structure as sections instead.
 */
export function ListView({ boardId }: ListViewProps) {
  const { data: board } = useBoard(boardId);
  const { data: members } = useBoardMembers(boardId);
  const { data: labels } = useBoardLabels(boardId);
  const { data, isLoading } = useBoardScheduledCards(boardId, { unscheduled: true });

  const [mode, setMode] = useState<GroupMode>('date');
  const [filters, setFilters] = useState<CardFilters>(emptyFilters);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { canEdit } = useDojoPermissions(boardId);

  const memberMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof members>[number]>();
    for (const m of members ?? []) map.set(m.userId, m);
    return map;
  }, [members]);

  const filteredScheduled = useMemo(
    () => applyFilters(data?.scheduled ?? [], filters),
    [data?.scheduled, filters],
  );
  const filteredUnscheduled = useMemo(
    () => applyFilters(data?.unscheduled ?? [], filters),
    [data?.unscheduled, filters],
  );

  const buckets = useMemo(
    () => bucketByDate(filteredScheduled, filteredUnscheduled),
    [filteredScheduled, filteredUnscheduled],
  );

  const byList = useMemo(() => {
    const map = new Map<string, ScheduledCard[]>();
    for (const card of [...filteredScheduled, ...filteredUnscheduled]) {
      const existing = map.get(card.listId) ?? [];
      existing.push(card);
      map.set(card.listId, existing);
    }
    return map;
  }, [filteredScheduled, filteredUnscheduled]);

  const selectedCard =
    board?.lists.flatMap((l) => l.cards).find((c) => c.id === selectedCardId) ?? null;

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
    <div className="max-w-3xl mx-auto pb-12">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        members={members}
        labels={labels}
      />
      <div className="flex items-center justify-between my-6 gap-3">
        {canEdit && mode === 'date' ? (
          // By-date sections have no implicit list, so a top-level
          // "Add" opens the dialog with a list picker. By-list mode
          // has per-section inline quick-add (the list IS the section)
          // so the top-level button is hidden to avoid two paths.
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setQuickAddOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
            Add a kata
          </button>
        ) : (
          <span />
        )}
        <div role="group" aria-label="Group cards by" className="join">
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === 'date' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setMode('date')}
            aria-pressed={mode === 'date'}
          >
            By date
          </button>
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setMode('list')}
            aria-pressed={mode === 'list'}
          >
            By list
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {mode === 'date' ? (
          <>
            {buckets.overdue.length > 0 && (
              <ListSection
                boardId={boardId}
                icon={faBolt}
                iconClassName="text-error"
                label="Overdue"
                cards={buckets.overdue}
                showListName
                members={memberMap}
                onCardClick={setSelectedCardId}
              />
            )}
            <ListSection
              boardId={boardId}
              icon={faCalendarDay}
              label="Today"
              cards={buckets.today}
              showListName
              members={memberMap}
              onCardClick={setSelectedCardId}
              emptyMessage="Nothing due today."
            />
            <ListSection
              boardId={boardId}
              icon={faCalendarWeek}
              label="This week"
              cards={buckets.thisWeek}
              showListName
              members={memberMap}
              onCardClick={setSelectedCardId}
              emptyMessage="Clear week ahead."
            />
            <ListSection
              boardId={boardId}
              icon={faCalendarPlus}
              label="Later"
              cards={buckets.later}
              showListName
              members={memberMap}
              onCardClick={setSelectedCardId}
            />
            {buckets.noDate.length > 0 && (
              <ListSection
                boardId={boardId}
                icon={faInbox}
                label="No date"
                cards={buckets.noDate}
                showListName
                members={memberMap}
                onCardClick={setSelectedCardId}
              />
            )}
          </>
        ) : (
          board.lists.map((list) => (
            <ListSection
              key={list.id}
              boardId={boardId}
              icon={faListUl}
              label={list.title}
              cards={(byList.get(list.id) ?? []).sort((a, b) => {
                if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
                return 0;
              })}
              showListName={false}
              members={memberMap}
              onCardClick={setSelectedCardId}
              quickAddListId={list.id}
            />
          ))
        )}
      </div>

      <CardDetailModal
        boardId={boardId}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />

      <QuickAddCardDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        boardId={boardId}
        lists={board.lists.map((l) => ({ id: l.id, title: l.title }))}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import {
  faBolt,
  faCalendarDay,
  faCalendarWeek,
  faCalendarPlus,
  faInbox,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  useClanScheduledCards,
  type ScheduledCard,
} from '@/hooks/use-scheduled-cards';
import { useClanPermissions } from '@/hooks/use-permissions';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { FilterBar } from '@/components/views/FilterBar';
import { ClanQuickAddCardDialog } from '@/components/views/ClanQuickAddCardDialog';
import { addDays, localDateKey } from '@/lib/calendar-dates';
import { dueDateKey } from '@/lib/due-dates';
import { applyFilters, emptyFilters, type CardFilters } from '@/lib/card-filters';
import { ListSection } from './ListSection';

interface ClanListViewProps {
  clanId: string;
}

interface DateBuckets {
  overdue: ScheduledCard[];
  today: ScheduledCard[];
  thisWeek: ScheduledCard[];
  later: ScheduledCard[];
  noDate: ScheduledCard[];
}

function bucketByDate(scheduled: ScheduledCard[], unscheduled: ScheduledCard[]): DateBuckets {
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
      buckets.later.push(card);
      continue;
    }
    if (!card.isCompleted && key < todayKey) buckets.overdue.push(card);
    else if (key === todayKey) buckets.today.push(card);
    else if (key > todayKey && key <= weekEndKey) buckets.thisWeek.push(card);
    else buckets.later.push(card);
  }

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
 * Clan-aggregated List view. Same date buckets as the dojo version,
 * but each row carries a dojo-color stripe and the dojo title (since
 * cards span many dojos). No "by list" toggle — list-grouping doesn't
 * map cleanly across multiple boards. The "Add a kata" button opens
 * a dojo + list picker (ClanQuickAddCardDialog) since neither is
 * implicit at the clan level.
 */
export function ClanListView({ clanId }: ClanListViewProps) {
  const { data, isLoading } = useClanScheduledCards(clanId, { unscheduled: true });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CardFilters>(emptyFilters);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { role: clanRole } = useClanPermissions(clanId);
  const canEdit = clanRole === 'admin' || clanRole === 'member';
  // Empty member map — clan views don't fetch board members per
  // dojo (would be N queries). Avatars degrade to the generic icon
  // placeholder. Phase 8 polish can add a clan-wide members fetch.
  const emptyMembers = useMemo(() => new Map(), []);

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

  const allCards = [...(data?.scheduled ?? []), ...(data?.unscheduled ?? [])];
  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;

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

  // boardId for the modal must come from the clicked card so the
  // PATCH lands on the right dojo. selectedCard is always defined
  // when modal is open (the open prop guards it), but TypeScript
  // can't know that — fall back to '' which the modal won't actually
  // use because !!selectedCardId gates the open prop.
  const modalBoardId = selectedCard?.boardId ?? '';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <FilterBar filters={filters} onChange={setFilters} />
      {canEdit && (
        <div className="flex items-center justify-start my-6">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setQuickAddOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="mr-2" />
            Add a kata
          </button>
        </div>
      )}
      <div className="space-y-8 mt-6">
        {buckets.overdue.length > 0 && (
          <ListSection
            boardId={modalBoardId}
            icon={faBolt}
            iconClassName="text-error"
            label="Overdue"
            cards={buckets.overdue}
            showListName={false}
            members={emptyMembers}
            onCardClick={setSelectedCardId}
            dojoAccent
          />
        )}
        <ListSection
          boardId={modalBoardId}
          icon={faCalendarDay}
          label="Today"
          cards={buckets.today}
          showListName={false}
          members={emptyMembers}
          onCardClick={setSelectedCardId}
          emptyMessage="Quiet across every dojo today."
          dojoAccent
        />
        <ListSection
          boardId={modalBoardId}
          icon={faCalendarWeek}
          label="This week"
          cards={buckets.thisWeek}
          showListName={false}
          members={emptyMembers}
          onCardClick={setSelectedCardId}
          emptyMessage="Clear week ahead."
          dojoAccent
        />
        <ListSection
          boardId={modalBoardId}
          icon={faCalendarPlus}
          label="Later"
          cards={buckets.later}
          showListName={false}
          members={emptyMembers}
          onCardClick={setSelectedCardId}
          dojoAccent
        />
        {buckets.noDate.length > 0 && (
          <ListSection
            boardId={modalBoardId}
            icon={faInbox}
            label="No date"
            cards={buckets.noDate}
            showListName={false}
            members={emptyMembers}
            onCardClick={setSelectedCardId}
            dojoAccent
          />
        )}
      </div>

      <CardDetailModal
        boardId={modalBoardId}
        card={selectedCard}
        open={!!selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />

      <ClanQuickAddCardDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        clanId={clanId}
      />
    </div>
  );
}

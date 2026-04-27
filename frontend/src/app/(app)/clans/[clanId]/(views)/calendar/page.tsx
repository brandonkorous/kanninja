'use client';

import { useParams } from 'next/navigation';
import { ClanCalendarView } from '@/components/views/calendar/ClanCalendarView';

export default function ClanCalendarPage() {
  const params = useParams();
  const clanId = params.clanId as string;

  return (
    <div className="h-full">
      <ClanCalendarView clanId={clanId} />
    </div>
  );
}

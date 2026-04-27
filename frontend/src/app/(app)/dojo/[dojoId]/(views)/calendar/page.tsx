'use client';

import { useParams } from 'next/navigation';
import { CalendarView } from '@/components/views/calendar/CalendarView';

export default function DojoCalendarPage() {
  const params = useParams();
  const boardId = params.dojoId as string;

  return (
    <div className="h-full">
      <CalendarView boardId={boardId} />
    </div>
  );
}

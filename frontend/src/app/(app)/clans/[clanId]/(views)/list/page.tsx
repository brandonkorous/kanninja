'use client';

import { useParams } from 'next/navigation';
import { ClanListView } from '@/components/views/list/ClanListView';

export default function ClanListPage() {
  const params = useParams();
  const clanId = params.clanId as string;

  return (
    <div className="overflow-y-auto h-full">
      <ClanListView clanId={clanId} />
    </div>
  );
}

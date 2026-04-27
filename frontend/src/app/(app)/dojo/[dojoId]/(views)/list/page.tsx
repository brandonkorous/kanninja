'use client';

import { useParams } from 'next/navigation';
import { ListView } from '@/components/views/list/ListView';

export default function DojoListPage() {
  const params = useParams();
  const boardId = params.dojoId as string;

  return (
    <div className="overflow-y-auto h-full">
      <ListView boardId={boardId} />
    </div>
  );
}

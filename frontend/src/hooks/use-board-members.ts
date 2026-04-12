'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './use-api';

export interface BoardMember {
  userId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export function useBoardMembers(boardId: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['boards', boardId, 'members'],
    queryFn: () =>
      api.get<{ data: BoardMember[] }>(`/api/v1/boards/${boardId}/members`).then((r) => r.data),
    enabled: !!boardId,
  });
}

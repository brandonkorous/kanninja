'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const api = useApi();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: Notification[] }>('/api/v1/notifications').then((r) => r.data),
  });
}

// Single mark-read is silent — the UI update is the confirmation.
export function useMarkRead() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useMarkAllRead() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => api.post('/api/v1/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Inbox cleared.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

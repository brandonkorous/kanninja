'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import type { ApiKey } from '@kanninja/shared';

export function useApiKeys() {
  const api = useApi();

  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () =>
      api.get<{ data: ApiKey[] }>('/api/v1/auth/api-keys').then((r) => r.data),
  });
}

interface CreateKeyResult {
  id: string;
  displayName: string;
  prefix: string;
  fullKey: string;
}

export function useCreateApiKey() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (displayName: string) =>
      api
        .post<{ data: CreateKeyResult }>('/api/v1/auth/api-keys', { displayName })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

export function useRevokeApiKey() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (keyId: string) => api.delete(`/api/v1/auth/api-keys/${keyId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

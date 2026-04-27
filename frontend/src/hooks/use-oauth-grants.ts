'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

export interface OAuthGrant {
  client_id: string;
  client_name: string;
  scopes: string[];
  authorized_at: string;
}

export function useOAuthGrants() {
  const api = useApi();
  return useQuery({
    queryKey: ['oauth-grants'],
    queryFn: () =>
      api.get<{ data: OAuthGrant[] }>('/api/v1/oauth/grants').then((r) => r.data),
  });
}

export function useRevokeOAuthGrant() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (clientId: string) =>
      api.delete(`/api/v1/oauth/grants/${encodeURIComponent(clientId)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oauth-grants'] });
      toast.success('Agent disconnected.');
    },
    onError: (err) => toast.error(getToastErrorMessage(err)),
  });
}

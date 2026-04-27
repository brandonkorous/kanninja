'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';

export interface AuthorizationRequest {
  req_id: string;
  client: { client_id: string; client_name: string };
  redirect_uri: string;
  scopes: string[];
  expires_at: string;
}

export function useAuthorizationRequest(reqId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ['oauth-auth-request', reqId],
    enabled: !!reqId,
    queryFn: () =>
      api.get<{ data: AuthorizationRequest } | AuthorizationRequest>(
        `/api/v1/oauth/auth-requests/${reqId}`,
      ).then((r) => ('data' in r ? r.data : r)),
  });
}

export function useConsent(reqId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (action: 'allow' | 'deny') =>
      api
        .post<{ redirect_url: string }>(
          `/api/v1/oauth/auth-requests/${reqId}/consent`,
          { action },
        )
        .then((r) => r.redirect_url),
  });
}

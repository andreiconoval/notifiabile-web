'use client';

import { useGetUserProfileEndpoint } from '@/api/generated/teammate.web';
import { useAuth } from '@/contexts/AuthContext';

export function useUserProfile() {
  const { hydrated, accessToken } = useAuth();
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useGetUserProfileEndpoint({
    query: {
      enabled: hydrated && !!accessToken, // ✅ must be nested under 'query'
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  return { user, isLoading, error, refetch };
}

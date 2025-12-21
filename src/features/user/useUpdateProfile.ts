'use client';

import { useUpdateUserProfileEndpoint } from '@/api/generated/teammate.web';
import { useUserProfile } from './useUserProfile';

export function useUpdateProfile() {
  const profileQuery = useUserProfile();
  return useUpdateUserProfileEndpoint({
    mutation: {
      onSuccess: () => {
        // simplest & precise
        profileQuery.refetch();
      },
    },
  });
}

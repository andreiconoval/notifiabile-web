'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function AuthQuerySync() {
  const qc = useQueryClient();
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      qc.removeQueries({
        predicate: (q) =>
          String(q.queryKey?.[0] ?? '')
            .toLowerCase()
            .includes('userprofile'),
      });
    }
  }, [accessToken, qc]);

  return null;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
// import type { OrganizationRoleAuth } from '@/api/generated/schemas';

type JwtPayload = { exp?: number; [k: string]: unknown };

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  organizationRole: string | null; //OrganizationRoleAuth | null;
  setTokens: (access: string, refresh: string | null) => void;
  setUserAuth: (userId?: string, organizationRole?: string | null) => void;
  clear: () => void;
  isAccessExpired: () => boolean;
  secondsToExpiry: () => number | null;

  // hydration flag
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      organizationRole: null,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh ?? get().refreshToken }),
      setUserAuth: (userId?: string, organizationRole?: string | null) =>
        set({ userId: userId, organizationRole: organizationRole }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, userId: undefined, organizationRole: null }),
      isAccessExpired: () => {
        const t = get().accessToken;
        if (!t) return true;
        try {
          const { exp } = jwtDecode<JwtPayload>(t) || {};
          return !exp || exp * 1000 <= Date.now();
        } catch {
          return true;
        }
      },
      secondsToExpiry: () => {
        const t = get().accessToken;
        if (!t) return null;
        try {
          const { exp } = jwtDecode<JwtPayload>(t) || {};
          return exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : null;
        } catch {
          return null;
        }
      },

      // hydration state
      _hasHydrated: false,
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
    }),
    {
      name: 'auth',
      version: 1,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userId: s.userId,
        organizationRole: s.organizationRole,
      }),
      // mark store hydrated after rehydration completes
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);

export function useAuthHasHydrated() {
  return useAuth((s) => s._hasHydrated);
}

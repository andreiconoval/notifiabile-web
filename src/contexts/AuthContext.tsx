import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AuthOAuthAuthorizationDetailsResponse,
  AuthOAuthConsentResponse,
  createClient,
  type Session,
} from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { api } from '../utils/api';
import { setHttpAuthTokens } from '../api/http';
import type { User, Organization, Environment, UserRole } from '../utils/types';
import {
  getListOrganizationsEndpointQueryKey,
  useListOrganizationsEndpoint,
} from '@/api/generated/notifiable.web';

type JwtPayload = { exp?: number; [k: string]: unknown };

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  selectedOrg: Organization | null;
  selectedEnv: Environment;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  loading: boolean;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectOrg: (org: Organization) => void;
  setEnvironment: (env: Environment) => void;
  setTokens: (access: string, refresh: string | null) => void;
  isAccessExpired: () => boolean;
  secondsToExpiry: () => number | null;
  getAuthorizationDetails: (
    authorizationId: string,
  ) => Promise<AuthOAuthAuthorizationDetailsResponse | null>;
  approveAuthorization: (authorizationId: string) => Promise<AuthOAuthConsentResponse | null>;
  denyAuthorization: (authorizationId: string) => Promise<AuthOAuthConsentResponse | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createClient(
  `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECTID}.supabase.co`,
  publicAnonKey,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<Environment>('production');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: organizationsResponse,
    isLoading: organizationsLoading,
    isFetching: organizationsFetching,
  } = useListOrganizationsEndpoint({
    query: {
      enabled: Boolean(accessToken),
    },
  });

  // Token management helpers
  const isAccessExpired = (): boolean => {
    if (!accessToken) return true;
    try {
      const { exp } = jwtDecode<JwtPayload>(accessToken) || {};
      return !exp || exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  };

  const secondsToExpiry = (): number | null => {
    if (!accessToken) return null;
    try {
      const { exp } = jwtDecode<JwtPayload>(accessToken) || {};
      return exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : null;
    } catch {
      return null;
    }
  };

  const setTokens = useCallback(
    (access: string, refresh: string | null) => {
      setAccessToken(access);
      setRefreshToken(refresh ?? null);
      if (access) {
        api.setToken(access);
        setHttpAuthTokens(access, refresh ?? null, selectedOrg?.id);
      }
    },
    [selectedOrg?.id],
  );

  // Sync organization ID to http interceptor whenever selectedOrg or tokens change
  useEffect(() => {
    if (accessToken) {
      setHttpAuthTokens(accessToken, refreshToken ?? null, selectedOrg?.id);
    } else {
      setHttpAuthTokens(null, null, null);
    }
  }, [selectedOrg?.id, accessToken, refreshToken]);

  const hydrateFromSession = useCallback(
    (session: Session, resetOrganizations = false) => {
      const userData: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || session.user.email!,
        role: (session.user.user_metadata.role as UserRole) || 'OrgViewer',
      };

      setUser(userData);
      setUserId(session.user.id);
      setTokens(session.access_token, session.refresh_token ?? null);

      if (resetOrganizations) {
        queryClient.removeQueries({ queryKey: getListOrganizationsEndpointQueryKey() });
        setLoading(true);
      }
    },
    [queryClient, setTokens],
  );

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setUserId(null);
    setOrganizations([]);
    setSelectedOrg(null);
    api.setToken(null);
    setHttpAuthTokens(null, null, null);
    queryClient.removeQueries({ queryKey: getListOrganizationsEndpointQueryKey() });
  }, [queryClient]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        hydrateFromSession(session, true);
      } else {
        clearAuthState();
        setLoading(false);
      }
      setHydrated(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const shouldReset = event === 'SIGNED_IN';
        hydrateFromSession(session, shouldReset);
      } else {
        clearAuthState();
        setLoading(false);
      }
      setHydrated(true);
    });

    return () => subscription.unsubscribe();
  }, [clearAuthState, hydrateFromSession]);

  useEffect(() => {
    if (!accessToken) {
      setOrganizations([]);
      setSelectedOrg(null);
      return;
    }

    if (!organizationsResponse) return;

    const normalizedOrgs: Organization[] = organizationsResponse
      .filter((org): org is NonNullable<typeof org> => Boolean(org?.id))
      .map((org) => ({
        id: org.id ?? '',
        name: org.name ?? 'Untitled organization',
        role: (org.role as UserRole) ?? 'OrgViewer',
        timezone: org.timezone ?? 'UTC',
        created: org.created ?? '',
      }));

    setOrganizations(normalizedOrgs);

    if (normalizedOrgs.length === 0) {
      setSelectedOrg(null);
      return;
    }

    if (!selectedOrg) {
      setSelectedOrg(normalizedOrgs[0]);
      return;
    }

    const matchingOrg = normalizedOrgs.find((org) => org.id === selectedOrg.id);

    if (!matchingOrg) {
      setSelectedOrg(normalizedOrgs[0]);
      return;
    }

    const hasChanged =
      matchingOrg.name !== selectedOrg.name ||
      matchingOrg.role !== selectedOrg.role ||
      matchingOrg.timezone !== selectedOrg.timezone ||
      matchingOrg.created !== selectedOrg.created;

    if (hasChanged) {
      setSelectedOrg(matchingOrg);
    }
  }, [accessToken, organizationsResponse, selectedOrg]);

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    if (organizationsLoading || organizationsFetching) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [accessToken, hydrated, organizationsLoading, organizationsFetching]);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || data.user.email!,
        role: data.user.user_metadata.role || 'OrgViewer',
      };
      setUser(userData);
      setUserId(data.user.id);
      setTokens(data.session.access_token, data.session.refresh_token ?? null);
      setLoading(true);
    }
  }

  async function signUp(email: string, password: string, name: string) {
    await api.signup(email, password, name);

    // Now sign in
    await signIn(email, password);
  }

  async function signOut() {
    await supabase.auth.signOut();
    clearAuthState();
    setLoading(false);
  }

  function selectOrg(org: Organization) {
    setSelectedOrg(org);
  }

  function setEnvironment(env: Environment) {
    setSelectedEnv(env);
  }

  async function getAuthorizationDetails(
    authorizationId: string,
  ): Promise<AuthOAuthAuthorizationDetailsResponse | null> {
    try {
      const response = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

      if (response.error) {
        throw new Error(`Failed to fetch authorization details:  ${response.error.message}`);
      }

      return response;
    } catch (error) {
      console.error('[AuthContext] Error fetching authorization details:', error);
      return null;
    }
  }

  async function approveAuthorization(
    authorizationId: string,
  ): Promise<AuthOAuthConsentResponse | null> {
    try {
      const response = await supabase.auth.oauth.approveAuthorization(authorizationId);

      if (response.error) {
        throw new Error(`Failed to approve authorization: ${response.error.message}`);
      }

      return response;
    } catch (error) {
      console.error('[AuthContext] Error approving authorization:', error);
      return null;
    }
  }

  async function denyAuthorization(
    authorizationId: string,
  ): Promise<AuthOAuthConsentResponse | null> {
    try {
      const response = await supabase.auth.oauth.denyAuthorization(authorizationId);

      if (response.error) {
        throw new Error(`Failed to deny authorization: ${response.error.message}`);
      }

      return response;
    } catch (error) {
      console.error('[AuthContext] Error denying authorization:', error);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        selectedOrg,
        selectedEnv,
        accessToken,
        refreshToken,
        userId,
        loading,
        hydrated,
        signIn,
        signUp,
        signOut,
        selectOrg,
        setEnvironment,
        setTokens,
        isAccessExpired,
        secondsToExpiry,
        getAuthorizationDetails,
        approveAuthorization,
        denyAuthorization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

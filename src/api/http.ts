import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import qs from 'qs';
import { getNotifiableAPI } from '@/api/generated/notifiable.server';
import { useAuth } from '@/contexts/AuthContext';

// Store for accessing auth state without React context (needed in non-React code)
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let currentOrganizationId: string | null = null;

export function setHttpAuthTokens(
  access: string | null,
  refresh: string | null,
  organizationId?: string | null,
) {
  currentAccessToken = access;
  currentRefreshToken = refresh;
  currentOrganizationId = organizationId ?? null;
}

// Called on 401 to refresh, then retry original request
async function tokenRefreshLogic(failedRequest: any) {
  if (!currentRefreshToken) {
    currentAccessToken = null;
    currentRefreshToken = null;
    currentOrganizationId = null;
    return Promise.reject(failedRequest);
  }

  // Call your refresh endpoint (adjust path/body to your API)
  try {
    // const response = await getNotifiableAPI().jwtTokenService({
    //   refreshToken: currentRefreshToken,
    // });

    const { accessToken, refreshToken: newRefresh } = {} as any;
    setHttpAuthTokens(accessToken ?? '', newRefresh ?? currentRefreshToken, currentOrganizationId);

    // set header for the retried request
    failedRequest.response.config.headers['Authorization'] = `Bearer ${accessToken}`;
    if (currentOrganizationId) {
      failedRequest.response.config.headers['Organization-Id'] = currentOrganizationId;
    }
    return Promise.resolve();
  } catch {
    currentAccessToken = null;
    currentRefreshToken = null;
    currentOrganizationId = null;
    return Promise.reject(failedRequest);
  }
}

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  paramsSerializer: {
    serialize: (params) =>
      qs.stringify(params, {
        arrayFormat: 'comma',
        encode: true,
      }),
  },
});

instance.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${currentAccessToken}`;

    if (currentOrganizationId) {
      config.headers['x-Organization-Id'] = currentOrganizationId;
    }
  }
  return config;
});

createAuthRefreshInterceptor(instance, tokenRefreshLogic, { statusCodes: [401] });

export const customAxios = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const r = await instance.request<T>(config);
  return r.data;
};
// Optional server-side axios (if you ever fetch from server using a token you pass manually)
export const serverAxios = async <T>(
  config: AxiosRequestConfig,
  overrides?: AxiosRequestConfig, // e.g., { headers: { Authorization: `Bearer ${token}` } }
): Promise<T> => {
  const instance = axios.create({
    baseURL: process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL,
    timeout: 15000,
    paramsSerializer: {
      serialize: (params) => qs.stringify(params, { arrayFormat: 'comma', encode: true }),
    },
    ...overrides,
  });

  const res = await instance.request<T>(config);
  return res.data;
};

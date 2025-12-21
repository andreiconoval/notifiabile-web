// 'use client';

// import { ErrorResponse, OrganizationRole, RoleBaseTokenResponse } from '@/api/generated/schemas';
// import { useAuth } from './auth-store';

// // ⬇️ Orval-generated hooks (adjust import paths)
// import { useLoginEndpoint, useJwtTokenService } from '@/api/generated/teammate.web';
// import { useRouter } from 'next/navigation';

// // Small helper to pull tokens out of any response shape
// function extractTokens(result: RoleBaseTokenResponse) {
//   return {
//     access: result?.accessToken,
//     refresh: result?.refreshToken ?? null,
//     userId: result?.userId ?? null,
//   };
// }

// export function useAuthApi() {
//   const setTokens = useAuth((s) => s.setTokens);
//   const setUserAuth = useAuth((s) => s.setUserAuth);
//   const router = useRouter();

//   const clear = useAuth((s) => s.clear);

//   const loginMut = useLoginEndpoint();
//   const refreshMut = useJwtTokenService?.();

//   async function login(
//     email: string,
//     password: string,
//     onSuccess?: () => void,
//     onError?: (err: ErrorResponse) => void,
//   ) {
//     const res = await loginMut.mutateAsync({
//       data: { email, password },
//     });

//     if (loginMut.error) {
//       onError?.(loginMut.error as ErrorResponse);
//       return;
//     }

//     const { access, refresh } = extractTokens(res);
//     if (!access) throw new Error('No access token in login response');
//     setTokens(access, refresh);
//     setUserAuth(res.userId, res.organizationRole ?? undefined);
//     onSuccess?.();
//     return res;
//   }

//   async function refresh(onSuccess?: () => void, onError?: (err: ErrorResponse) => void) {
//     const { refreshToken, userId, organizationRole } = useAuth.getState();
//     if (!refreshToken) throw new Error('No refresh token');
//     if (!refreshMut) throw new Error('Refresh hook not available');

//     const res = await refreshMut.mutateAsync({
//       data: {
//         refreshToken: refreshToken,
//         userId: userId ?? undefined,
//         organizationRole: {
//           organizationId: organizationRole?.organizationId,
//           organizationRole: organizationRole?.organizationRole,
//         },
//       },
//     });

//     if (refreshMut.error) {
//       onError?.(refreshMut.error as ErrorResponse);
//       throw new Error('Error on refresh');
//     }

//     const { access, refresh } = extractTokens(res);
//     if (!access) throw new Error('No access token in refresh response');
//     setTokens(access, refresh ?? refreshToken);

//     setUserAuth(res.userId, res.organizationRole ?? undefined);
//     onSuccess?.();
//     return res;
//   }

//   async function refreshWithOrganizationAuth(
//     organizationRole: { organizationId?: string; role?: OrganizationRole },
//     onSuccess?: () => void,
//     onError?: (err: ErrorResponse) => void,
//   ) {
//     const { refreshToken, userId } = useAuth.getState();
//     if (!refreshToken) throw new Error('No refresh token');
//     if (!refreshMut) throw new Error('Refresh hook not available');

//     let organizationRoleParam:
//       | { organizationId?: string; organizationRole?: OrganizationRole }
//       | undefined = undefined;

//     if (organizationRole.organizationId && organizationRole.role) {
//       organizationRoleParam = {
//         organizationId: organizationRole.organizationId,
//         organizationRole: organizationRole.role,
//       };
//     }

//     const res = await refreshMut.mutateAsync({
//       data: {
//         refreshToken: refreshToken,
//         userId: userId ?? undefined,
//         organizationRole: organizationRoleParam,
//       },
//     });

//     if (refreshMut.error) {
//       onError?.(refreshMut.error as ErrorResponse);
//       return;
//     }

//     const { access, refresh } = extractTokens(res);
//     if (!access) throw new Error('No access token in refresh response');
//     setTokens(access, refresh ?? refreshToken);
//     setUserAuth(res.userId, res.organizationRole ?? undefined);
//     onSuccess?.();
//     window.location.reload(); // full reload

//     return res;
//   }

//   return {
//     login,
//     refresh,
//     refreshWithOrganizationAuth,
//     isLoggingIn: loginMut.isPending,
//     loginError: loginMut.error,
//     // expose refresh status if you want
//     isRefreshing: refreshMut?.isPending ?? false,
//     refreshError: refreshMut?.error,
//     clear,
//   };
// }

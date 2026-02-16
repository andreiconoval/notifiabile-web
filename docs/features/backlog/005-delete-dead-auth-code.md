# TASK-005: Delete unused Zustand auth store and dead feature files

**Priority:** HIGH
**Category:** Dead Code / Architecture
**Effort:** Small

## Problem

Three auth implementations exist, but only `AuthContext` is used. The others are dead code causing confusion:

1. **`src/auth/auth-store.ts`** — Zustand store with `isAccessExpired()`, `secondsToExpiry()`, token persistence. **Zero imports** across the codebase (all 25+ components use `useAuth` from AuthContext instead).
2. **`src/auth/use-auth-api.ts`** — Entirely commented out. References old `teammate.web` API.
3. **`src/features/user/AuthQuerySync.tsx`** — Defined but never mounted anywhere.
4. **`src/features/user/useUserProfile.ts`** — Entirely commented out, references old API.
5. **`src/features/user/useUpdateProfile.ts`** — Entirely commented out, references old API.
6. **`src/hooks/use-lookups.tsx`** — 91 lines, entirely commented out, references old API.
7. **`src/hooks/use-toast.ts`** — 186 lines, entirely commented out. Project uses `sonner` instead.
8. **`src/api/error-response.tsx`** — Never imported. Conflicts with generated `ErrorResponse` schema. Also has wrong `.tsx` extension for a types-only file.

Additionally, `src/auth/client-guard.tsx` line 14 has a misleading comment referencing "zustand" when it actually uses AuthContext.

## What To Do

1. Delete these files:
   - `src/auth/auth-store.ts`
   - `src/auth/use-auth-api.ts`
   - `src/features/user/AuthQuerySync.tsx`
   - `src/features/user/useUserProfile.ts`
   - `src/features/user/useUpdateProfile.ts`
   - `src/hooks/use-lookups.tsx`
   - `src/hooks/use-toast.ts`
   - `src/api/error-response.tsx`
2. Fix comment in `src/auth/client-guard.tsx` line 14: change "zustand has loaded from localStorage" to "AuthContext has hydrated session"
3. If `src/features/user/` directory is empty after deletion, remove it
4. Verify no imports break after deletion (grep for each filename)

## Acceptance Criteria

- All 8 files deleted
- No broken imports
- Misleading zustand comment fixed
- `src/features/user/` cleaned up

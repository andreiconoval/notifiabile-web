# TASK-002: Implement token refresh logic (currently stubbed)

**Priority:** CRITICAL
**Category:** Auth / Security
**Effort:** Medium

## Problem

The 401 token refresh interceptor in `src/api/http.ts` (lines 23-52) is completely non-functional. The actual API call is commented out and replaced with:

```typescript
const { accessToken, refreshToken: newRefresh } = {} as any; // always undefined
```

When a user's access token expires, every API call fails with 401 and the "refresh" sets the token to an empty string, making all subsequent requests fail. Users must manually re-login.

## What To Do

1. Determine the correct refresh endpoint from the backend API (e.g. `POST /api/identity/token/refresh`)
2. If the endpoint exists in the OpenAPI spec, use the generated function. If not, add it to `openapi.json` and regenerate.
3. Replace the stubbed logic in `src/api/http.ts` `tokenRefreshLogic()`:
   ```typescript
   const response = await axios.post('/api/identity/token/refresh', {
     refreshToken: currentRefreshToken,
   });
   const { accessToken, refreshToken: newRefresh } = response.data;
   ```
4. Also fix the **organization header inconsistency** in the same function:
   - Line 43 uses `Organization-Id` (no `x-` prefix)
   - Line 72 uses `x-Organization-Id` (correct)
   - Change line 43 to `x-Organization-Id` to match

## Files

- `src/api/http.ts` — lines 23-52 (refresh logic), line 43 (header name)

## Acceptance Criteria

- When access token expires, a 401 triggers automatic token refresh
- On successful refresh, the original request is retried with the new token
- On failed refresh, user is redirected to `/auth`
- Organization header name is consistently `x-Organization-Id` in both paths

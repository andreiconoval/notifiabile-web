# TASK-001: Fix double `/api/api/` URL prefix in OpenAPI spec

**Priority:** CRITICAL
**Category:** API / Code Generation
**Effort:** Small

## Problem

The OpenAPI spec (`openapi.json`) contains malformed paths with a double `/api/api/` prefix. Orval generates all hooks and axios calls from this spec, so every generated endpoint hits the wrong URL and returns 404.

**Affected paths in `openapi.json`:**
- `/api/api/identity/organizations` (should be `/api/identity/organizations`)
- `/api/api/identity/organizations/{id}`
- `/api/api/identity/organizations/me`
- `/api/api/identity/api-keys`
- `/api/api/identity/api-keys/{id}`
- `/api/api/providers`
- `/api/api/providers/{id}`
- `/api/api/providers/{id}/make-default`
- `/api/api/providers/{id}/status`

A similar issue exists for internal notifications:
- `/api/internal-notifications/api/internal-notifications` (double `internal-notifications`)

**Generated files affected:**
- `src/api/generated/notifiable.web.ts` — all React Query hooks
- `src/api/generated/notifiable.server.ts` — all server axios calls

## Root Cause

The backend ASP.NET Core app (NSwag v14.4.0) generates the spec with an extra `/api/` segment. The fix should be applied in the backend swagger configuration, then the spec re-exported and orval re-run.

## What To Do

1. **If backend is owned by this team:** Fix the route prefix in backend swagger config, re-export spec
2. **If backend is external:** Use `openapi.json` path rewriting in `scripts/fetch-openapi.mjs` to strip the duplicate `/api/` prefix after fetching
3. Run `pnpm orval` to regenerate both clients
4. Verify all endpoints return 200 (not 404)

## Acceptance Criteria

- All generated URLs use single `/api/` prefix (e.g. `/api/identity/organizations`)
- Internal notification URLs use `/api/internal-notifications/{id}/consume` (not doubled)
- All existing pages that use generated hooks (providers, templates, audiences, recipients, api-keys, notifications) work correctly

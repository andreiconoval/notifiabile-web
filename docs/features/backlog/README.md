# Project Backlog — Prioritized Task List

Full codebase audit performed on 2026-02-15. Tasks are ordered by priority — implement top-to-bottom.

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| CRITICAL | 3 | App-breaking bugs and security vulnerabilities |
| HIGH | 4 | Auth failures, dead code, production debug logs |
| MEDIUM | 3 | Incomplete features, type cleanup, code quality |
| LOW | 2 | Documentation, error handling improvements |

---

## CRITICAL — Fix before any deployment

| # | Task | Category | Effort |
|---|------|----------|--------|
| [001](./001-fix-openapi-double-prefix.md) | Fix double `/api/api/` URL prefix in OpenAPI spec | API | Small |
| [002](./002-implement-token-refresh.md) | Implement token refresh logic (currently stubbed) + fix org header inconsistency | Auth | Medium |
| [003](./003-revoke-exposed-secrets.md) | Revoke exposed Supabase secrets in `.env.local`, create `.env.example` | Security | Small |

## HIGH — Fix within the current sprint

| # | Task | Category | Effort |
|---|------|----------|--------|
| [004](./004-fix-auth-race-conditions.md) | Fix race conditions in AuthContext token/org sync | Auth | Medium |
| [005](./005-delete-dead-auth-code.md) | Delete unused Zustand store, commented-out hooks, dead feature files (8 files) | Dead Code | Small |
| [006](./006-remove-console-logs.md) | Remove debug `console.log` from 27 production files | Security | Medium |
| [007](./007-migrate-legacy-api-pages.md) | Migrate 7 pages from legacy `api` client to Orval hooks | API | Large |

## MEDIUM — Fix within 1-2 sprints

| # | Task | Category | Effort |
|---|------|----------|--------|
| [008](./008-delete-unused-types.md) | Remove 8 unused manual type definitions from `types.ts` | Dead Code | Small |
| [009](./009-fix-stub-pages.md) | Fix non-functional stub pages (settings, health, campaigns) | UI | Large |
| [010](./010-fix-miscellaneous-code-quality.md) | Fix misspelled filename, duplicate toast, duplicate hook, wildcard dep, tsconfig, auth fallback | Quality | Small |

## LOW — Fix when time allows

| # | Task | Category | Effort |
|---|------|----------|--------|
| [011](./011-consolidate-oauth-docs.md) | Consolidate 3 overlapping OAuth docs into one, review MCP docs | Docs | Small |
| [012](./012-add-error-boundaries.md) | Add error boundaries to dashboard, fix missing error toasts | UX | Medium |

---

## Key Findings

**API Layer:** The OpenAPI spec has malformed paths (`/api/api/...`) causing all generated hooks to hit wrong URLs. Token refresh is completely stubbed — 401 errors are unrecoverable. The legacy `ApiClient` in `utils/api.ts` calls a dead Supabase edge function and should be migrated away.

**Authentication:** Two competing code paths sync tokens to HTTP interceptors, creating race conditions when switching organizations. A dead Zustand auth store and 7 commented-out files add confusion. The org header name is inconsistent between initial requests (`x-Organization-Id`) and retry requests (`Organization-Id`).

**Dashboard Pages:** 7 of 14 pages still use the legacy mock API. Settings, health, and campaigns pages are non-functional UI mockups with no-op buttons. Two pages swallow errors without notifying users.

**Security:** `.env.local` with real Supabase service role key is committed to git. 27 files contain debug `console.log` statements including middleware that logs on every request. The legacy API client silently falls back to a public anonymous key when no auth token is set.

**Code Quality:** 8 unused type interfaces, 8 dead files (500+ lines of commented code), duplicate `useIsMobile` hook, duplicate toast providers, misspelled filename, misplaced tsconfig options, overlapping documentation files.

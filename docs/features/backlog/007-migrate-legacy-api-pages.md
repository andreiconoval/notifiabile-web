# TASK-007: Migrate remaining pages from legacy `api` client to Orval hooks

**Priority:** HIGH
**Category:** API Migration
**Effort:** Large

## Problem

7 pages still use the legacy mock `ApiClient` from `src/utils/api.ts` which calls a dead Supabase edge function URL. These pages use manual `useState`/`useEffect` patterns instead of React Query hooks, missing out on caching, automatic refetching, and error handling.

## Pages to Migrate

| Page | File | Legacy Calls | Backend Endpoint Exists? |
|------|------|--------------|--------------------------|
| Overview | `src/app/dashboard/overview/page.tsx` | `api.getAnalyticsOverview()` | No — needs backend endpoint |
| Reporting | `src/app/dashboard/reporting/page.tsx` | `api.getAnalyticsOverview()` | No — needs backend endpoint |
| Campaigns | `src/app/dashboard/campaigns/page.tsx` | `api.getCampaigns()`, `api.createCampaign()` | No — needs backend endpoint |
| Webhooks | `src/app/dashboard/webhooks/page.tsx` | `api.getWebhooks()`, `api.createWebhook()` | No — needs backend endpoint |
| Audit Log | `src/app/dashboard/audit-log/page.tsx` | `api.getAuditLog()` | No — needs backend endpoint |
| Layout | `src/app/dashboard/layout.tsx` | `api.seedData()` | No — dev-only |

## Pages Already Migrated (reference pattern)

These pages are correctly using Orval hooks — use them as templates:
- `src/app/dashboard/api-keys/page.tsx` — `useListApiKeysEndpoint`, `useCreateApiKeyEndpoint`
- `src/app/dashboard/providers/page.tsx` — `useListProvidersEndpoint`
- `src/app/dashboard/templates/page.tsx` — `useGetTemplateListEndpoint`
- `src/app/dashboard/audiences/page.tsx` — `useListAudiencesEndpoint`
- `src/app/dashboard/recipients/page.tsx` — `useListContactsEndpoint`
- `src/app/dashboard/notifications/page.tsx` — `useGetNotificationsListEndpoint`

## What To Do

For each page:
1. Check if the backend endpoint exists in `openapi.json`. If not, this page cannot be migrated until the backend adds the endpoint — mark as blocked.
2. If endpoint exists: replace `useState`/`useEffect`/`api.method()` with the generated hook (same pattern as api-keys page)
3. If endpoint does NOT exist: add a comment at the top of the file documenting the dependency, and keep the legacy code for now
4. Add `toast.error()` on failure where missing (overview and reporting pages only show `console.error`)

## After All Migrations

Once no pages import from `src/utils/api.ts`, delete:
- The entire `ApiClient` class and all its methods
- Only keep `api.setToken()` and `api.signup()` if still needed by AuthContext (or migrate those too)

## Acceptance Criteria

- All pages with available backend endpoints use generated Orval hooks
- Pages without backend endpoints are documented with blocking dependency
- Error toasts shown to users on all failure paths
- Legacy `api` client has no remaining callers (or only auth-related ones)

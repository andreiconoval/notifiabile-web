# TASK-006: Remove debug console.log statements from production code

**Priority:** HIGH
**Category:** Security / Code Quality
**Effort:** Medium

## Problem

27 files contain `console.log` / `console.warn` / `console.error` statements. The worst offender is `src/middleware.ts` which logs on **every request**: cookie names, auth session state, and request paths. This leaks debug info in production and pollutes logs.

## Key Files

**Middleware (runs on every request):**
- `src/middleware.ts` — lines 6, 20-23, 30-32, 44-47: logs request path, cookie names, session state

**Auth/API layer:**
- `src/contexts/AuthContext.tsx` — multiple `console.error` and `console.log` calls
- `src/utils/api.ts` — line 37: `console.error` on every API failure
- `src/utils/supabase/server-client.ts` — multiple debug logs

**Dashboard pages (27 files total):**
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/overview/page.tsx`
- `src/app/dashboard/campaigns/page.tsx`
- `src/app/dashboard/webhooks/page.tsx`
- `src/app/dashboard/reporting/page.tsx`
- `src/app/dashboard/audit-log/page.tsx`
- `src/app/dashboard/notifications/page.tsx`
- `src/app/dashboard/audiences/page.tsx`
- `src/app/dashboard/recipients/page.tsx`
- `src/app/dashboard/providers/page.tsx` and components
- `src/app/dashboard/templates/page.tsx`
- MCP route handlers (`src/app/api/mcp/*/route.ts`)

## What To Do

1. **Remove all `console.log`** statements — these are purely debug
2. **Keep `console.error`** only in catch blocks where the error is also shown to the user (via toast), and only if it adds value for debugging
3. **Strip middleware logging entirely** — it logs on every request and exposes sensitive info
4. Optionally: create a `src/lib/logger.ts` utility that only logs in development:
   ```typescript
   export const logger = {
     debug: (...args: unknown[]) => {
       if (process.env.NODE_ENV === 'development') console.log(...args);
     },
     error: (...args: unknown[]) => console.error(...args),
   };
   ```

## Acceptance Criteria

- Zero `console.log` in production code
- Middleware has no logging (or only behind `NODE_ENV === 'development'` check)
- `console.error` used sparingly and only alongside user-facing error handling

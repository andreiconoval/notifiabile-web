# TASK-012: Add error boundaries and missing error toasts

**Priority:** LOW
**Category:** UX / Error Handling
**Effort:** Medium

## Problem

### Missing error boundaries
No React error boundary wraps the dashboard. If any page throws during render, the entire app crashes with a white screen.

### Missing error toasts
Two pages catch API errors but only log to console without notifying the user:

- `src/app/dashboard/overview/page.tsx` line 45: `console.error()` only, no `toast.error()`
- `src/app/dashboard/reporting/page.tsx` line 53: `console.error()` only, no `toast.error()`

### Silent error swallowing in OAuth
`src/contexts/AuthContext.tsx` `getAuthorizationDetails()` catches all errors and returns `null`, losing error context. The consent page shows a generic "Unable to load" message instead of the actual error.

## What To Do

1. Create `src/components/error-boundary.tsx` using React's `ErrorBoundary` pattern (or use `react-error-boundary` package)
2. Wrap `src/app/dashboard/layout.tsx` children in the error boundary with a fallback UI
3. Add `toast.error()` to overview and reporting page catch blocks
4. In `AuthContext.getAuthorizationDetails()`: throw the error instead of returning null, let the caller handle it with a meaningful message

## Acceptance Criteria

- Dashboard pages that throw render errors show a fallback UI instead of white screen
- All API error catch blocks notify the user via toast
- OAuth consent page shows specific error messages, not generic ones

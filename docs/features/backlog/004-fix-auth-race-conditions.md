# TASK-004: Fix race conditions in AuthContext token/org sync

**Priority:** HIGH
**Category:** Auth / State Management
**Effort:** Medium

## Problem

`src/contexts/AuthContext.tsx` has two competing code paths that call `setHttpAuthTokens()`:

### Race 1: Duplicate token sync (lines 96-115)

- **Path A** (line 102): Inside `setTokens` callback — deps: `[selectedOrg?.id]`
- **Path B** (line 111): Separate `useEffect` — deps: `[selectedOrg?.id, accessToken, refreshToken]`

When `selectedOrg` changes, both paths fire. The `setTokens` callback may capture stale token values from its closure while the `useEffect` has current values. This causes inconsistent interceptor state when switching organizations.

### Race 2: `selectedOrg` in its own effect dependencies (lines 179-226)

The org sync effect includes `selectedOrg` in its dependency array, but the effect itself calls `setSelectedOrg()`. This creates a re-render loop (mitigated by React batching but still inefficient and error-prone).

## What To Do

### Fix Race 1
Remove the duplicate `useEffect` (lines 108-115). Let the `setTokens` callback be the single path for token updates, and add a separate effect only for org changes:

```typescript
// Single effect for org ID changes only
useEffect(() => {
  if (accessToken) {
    setHttpAuthTokens(accessToken, refreshToken ?? null, selectedOrg?.id);
  }
}, [selectedOrg?.id]);
```

### Fix Race 2
Remove `selectedOrg` from the dependency array of the org sync effect (line 226). Use a ref to access the current `selectedOrg` without triggering re-runs:

```typescript
const selectedOrgRef = useRef(selectedOrg);
selectedOrgRef.current = selectedOrg;

useEffect(() => {
  // ... normalization logic ...
  const current = selectedOrgRef.current;
  if (!current && normalizedOrgs.length > 0) {
    setSelectedOrg(normalizedOrgs[0]);
  }
  // ...
}, [accessToken, organizationsResponse]); // no selectedOrg
```

## Files

- `src/contexts/AuthContext.tsx` — lines 96-115 (token sync), lines 179-226 (org sync)

## Acceptance Criteria

- Only one code path calls `setHttpAuthTokens()` per state change
- Org sync effect does not depend on `selectedOrg`
- Switching organizations does not cause extra re-renders or stale token state

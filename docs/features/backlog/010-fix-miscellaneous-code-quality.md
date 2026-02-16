# TASK-010: Fix miscellaneous code quality issues

**Priority:** MEDIUM
**Category:** Code Quality
**Effort:** Small

## Issues

### 1. Misspelled filename: `fileds.tsx` → `fields.tsx`

**File:** `src/app/dashboard/templates/fileds.tsx`

The filename is misspelled. Also, line 53 has a wrong label:
```tsx
<Label htmlFor="smsText">Email Body (HTML)</Label>  // should be "SMS Text"
```

**Fix:** Rename file, update import in `create-template-dialog.tsx`, fix the label.

### 2. Duplicate toast providers in `providers.tsx`

**File:** `src/app/providers.tsx` (lines 10, 13, 25-26)

Both `Toaster` from `@/components/ui/sonner` and `Toaster` from `sonner` are mounted. They do the same thing — remove one.

```tsx
// Remove one of these:
<ShadcnToaster position="top-right" />
<SonnerToaster richColors />
```

**Fix:** Keep the `sonner` `Toaster` (with `richColors`), remove the shadcn wrapper.

### 3. Duplicate `useIsMobile` hook

Two copies exist:
- `src/components/ui/use-mobile.ts` — **used** by sidebar.tsx
- `src/hooks/use-mobile.tsx` — **never imported**

**Fix:** Delete `src/hooks/use-mobile.tsx`.

### 4. Wildcard Supabase version in `package.json`

```json
"@supabase/supabase-js": "*"
```

Wildcard allows breaking major version upgrades.

**Fix:** Pin to current version: `"@supabase/supabase-js": "^2.49.0"` (or whatever is in lockfile).

### 5. Misplaced tsconfig options

`tsconfig.json` lines 32-35: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`, `resolveJsonModule` are placed outside `compilerOptions`. TypeScript ignores them there.

**Fix:** Move inside `compilerOptions` block. Remove duplicate `resolveJsonModule` (already on line 17).

### 6. Legacy API client public key fallback

`src/utils/api.ts` line 25: when `token` is null, falls back to `publicAnonKey`:
```typescript
Authorization: `Bearer ${this.token || publicAnonKey}`,
```

This makes unauthenticated API calls succeed silently instead of failing.

**Fix:** Throw error when no token is set (or at minimum log a warning), unless the specific method is intended to be public.

## Acceptance Criteria

- `fileds.tsx` renamed to `fields.tsx`, wrong label fixed
- Single toast provider mounted
- No duplicate `useIsMobile` hook
- Supabase version pinned
- tsconfig compiler options correctly placed
- No silent auth fallback to public key

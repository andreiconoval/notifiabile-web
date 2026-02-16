# Task 07: Clean Up & Verify Build

## Scope

Final pass after all component rewrites.

## Checklist

### Code Cleanup

- [ ] Remove any unused imports across modified files
- [ ] Remove `providerLabels` and `channelLabels` from both dialogs (if not already done)
- [ ] Remove the `renderChannelFields()` function from both dialogs
- [ ] Confirm no remaining references to top-level `apiKey`, `secretKey`, `fromAddress`, `endpoint`, `region` in provider components (these fields no longer exist on the DTOs)
- [ ] Ensure `src/utils/types.ts` has no stale provider-related manual types that conflict with generated schemas

### Build Verification

```bash
pnpm build
```

- [ ] No TypeScript errors
- [ ] No unused variable warnings from ESLint

```bash
pnpm lint
```

- [ ] Lint passes cleanly

### Manual Smoke Test

- [ ] Open providers page — grid renders, no console errors
- [ ] Click "Add Provider" — discovery data loads, provider picker shows all channels/providers
- [ ] Select a provider — dynamic form renders correct field types
- [ ] Fill in required fields, submit — provider created, appears in grid
- [ ] Click "Configure" on a provider card — update dialog opens with pre-filled values
- [ ] Secret fields show placeholder, not the actual value
- [ ] Submit update — provider updated successfully
- [ ] Provider info section shows dynamic content from discovery API

### Edge Cases

- [ ] Provider with only required settings (no optional) — form works
- [ ] Provider with boolean settings — switch renders and submits correctly
- [ ] Provider with JSON field type — textarea renders with monospace
- [ ] Backend validation error — error message appears on the correct field
- [ ] Discovery API slow/failed — loading state shown, no crash

# TASK-008: Remove unused manual type definitions from `types.ts`

**Priority:** MEDIUM
**Category:** Dead Code / Types
**Effort:** Small

## Problem

`src/utils/types.ts` defines 8 interfaces that are never imported anywhere. Generated schemas from Orval are the source of truth for API types. Keeping manual duplicates causes confusion about which types to use.

## Unused Interfaces to Delete

| Interface | Lines | Generated Replacement |
|-----------|-------|----------------------|
| `Notification` | 28-43 | `NotificationListItemResponse` from schemas |
| `Campaign` | 45-67 | No generated equivalent yet (backend endpoint pending) |
| `Template` | 69-86 | `TemplateResponse` from schemas |
| `Audience` | 88-97 | `AudienceGroupDto` from schemas |
| `Provider` | 99-115 | `ProviderResponse` from schemas |
| `Webhook` | 117-127 | No generated equivalent yet |
| `AuditLog` | 129-136 | No generated equivalent yet |
| `AnalyticsOverview` | 138-152 | No generated equivalent yet |

Also unused:
- `CampaignStatus` (line 9) — only used by deleted `Campaign` interface
- `TemplateStatus` (line 11) — only used by deleted `Template` interface
- `Channel` (line 7) — only used by deleted interfaces

## Types to KEEP (actively used)

- `UserRole` (line 3) — used in AuthContext.tsx
- `Environment` (line 5) — used in AuthContext.tsx, layout.tsx
- `User` (lines 13-18) — used in AuthContext.tsx
- `Organization` (lines 20-26) — used in AuthContext.tsx

## What To Do

1. Delete all 8 unused interfaces and 3 unused type aliases
2. Remove the `NotificationStatus` import on line 1 (only used by deleted `Notification` interface)
3. Verify no other file imports any of the deleted types (grep each name)
4. Update any remaining imports in legacy pages if they reference these types (they shouldn't — audit found zero)

## Files

- `src/utils/types.ts`

## Acceptance Criteria

- `types.ts` only contains `UserRole`, `Environment`, `User`, `Organization`
- No broken imports anywhere
- No manual types that duplicate generated schemas

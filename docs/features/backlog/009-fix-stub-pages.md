# TASK-009: Fix non-functional stub pages (settings, health, campaigns)

**Priority:** MEDIUM
**Category:** UI / Functionality
**Effort:** Large

## Problem

Three dashboard pages are UI mockups with no working backend integration. Buttons are no-ops, data is hardcoded, and forms don't submit.

## Settings Page (`src/app/dashboard/settings/page.tsx`)

**Issues:**
- "Save Changes" button (line 60): no `onClick` or form submit handler
- Organization name input (line 43): `defaultValue` with no `onChange` — changes are lost
- Timezone select (line 47): no `onValueChange` handler
- "Manage" suppression list buttons (lines 76, 85): no handlers
- "Invite Member" button (line 102): no handler
- "Enable 2FA" button (line 126): no handler
- "Configure IP Allowlist" button (line 135): no handler
- "Start Domain Setup" button (line 158): no handler
- No permission checks (any role can access)
- Unused icon imports: `Settings`, `Users`, `Shield`, `Globe` (line 10)

**Action:** Either implement with real API calls or add prominent "Coming Soon" badges to non-functional sections. Wire up the organization name/timezone form using `useUpdateOrganizationEndpoint()`.

## Health Page (`src/app/dashboard/health/page.tsx`)

**Issues:**
- All metrics are hardcoded initial values (lines 33-69)
- `Math.random()` simulates queue data updates every 5 seconds (lines 74-103)
- Provider statuses hardcoded as "operational" (lines 247-262)
- SLA percentages hardcoded: "99.2%", "97.8%" (lines 360-368)
- `import { api }` on line 4 is unused
- No real monitoring API endpoint exists

**Action:** Either connect to a real health/monitoring API when available, or add a banner: "Showing simulated data — monitoring integration pending."

## Campaigns Page (`src/app/dashboard/campaigns/page.tsx`)

**Issues:**
- Play/Pause/Analytics buttons (lines 160-162): no click handlers, icon-only without `aria-label`
- Uses legacy `api.getCampaigns()` / `api.createCampaign()`
- No backend campaign endpoints exist in the OpenAPI spec

**Action:** Add `aria-label` to icon buttons. Mark buttons as disabled until backend support is ready.

## Acceptance Criteria

- No silent no-op buttons — either functional or visibly disabled/labeled "Coming Soon"
- Settings org name/timezone form works with backend API
- Health page clearly indicates simulated data if no real API exists
- All icon-only buttons have `aria-label`

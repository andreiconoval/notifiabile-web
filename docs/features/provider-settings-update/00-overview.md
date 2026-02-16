# Provider Settings Update — Task Overview

## Goal

Replace all hardcoded provider field logic with a dynamic, schema-driven approach using the backend's Provider Discovery API. The frontend should render provider settings forms entirely from metadata — no switch statements, no hardcoded field lists.

## Current State

- `create-provider-dialog.tsx` and `update-provider-dialog.tsx` both contain:
  - Hardcoded `providerLabels` and `channelLabels` maps
  - A `renderChannelFields()` switch statement for Email/Push/SMS-specific inputs
  - Manual `FormData.get()` calls instead of `react-hook-form`
  - Hardcoded `apiKey`, `apiSecret`, `fromAddress`, `endpoint`, `region` field names
  - A manual "Additional Settings" key-value add/remove section
- `provider-info.tsx` has hardcoded provider descriptions
- `provider-card.tsx` references hardcoded icon and status mappings (keep status, update icon fallback)

## API Already Available

The OpenAPI client is already regenerated. These hooks exist:
- `useGetAvailableProvidersEndpoint()` — returns all channels + providers + settings schemas
- `useGetProviderSchemaEndpoint(providerType)` — returns a single provider's schema
- Types: `AvailableProvidersResponse`, `ChannelDefinitionResponse`, `ProviderDefinitionResponse`, `ProviderSettingDefinitionResponse`, `SettingFieldType`

## Task Sequence

| # | Task | File(s) | Depends On |
|---|------|---------|------------|
| 01 | Create shared `useAvailableProviders` hook with caching | New: `hooks/use-available-providers.ts` | — |
| 02 | Create `ProviderSettingsForm` dynamic form component | New: `provider-settings-form.tsx` | 01 |
| 03 | Rewrite `CreateProviderDialog` | `create-provider-dialog.tsx` | 01, 02 |
| 04 | Rewrite `UpdateProviderDialog` | `update-provider-dialog.tsx` | 01, 02 |
| 05 | Update `ProviderCard` display | `provider-card.tsx` | 01 |
| 06 | Update `ProviderInfo` to use discovery data | `provider-info.tsx` | 01 |
| 07 | Clean up & verify build | All modified files | 03–06 |

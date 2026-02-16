# Feature: Dynamic Provider Settings — Frontend Update

## Context: Backend Changes

The backend has been refactored to remove all hardcoded provider fields from the `Provider` entity and DTOs. The fields `apiKey`, `secretKey`, `fromAddress`, `endpoint`, and `region` no longer exist as top-level properties. **All provider settings are now stored as generic key-value pairs** in the `settings` dictionary.

Additionally, the backend now has a **Provider Discovery API** that tells the frontend exactly which settings each provider type requires — field types, display names, placeholders, required/optional, and default values.

### What Changed on the Backend

**Removed from `CreateProviderRequest`, `UpdateProviderRequest`, `ProviderResponse`:**
- `apiKey` (string)
- `secretKey` (string)
- `fromAddress` (string)
- `endpoint` (string)
- `region` (string)

**Kept/unchanged:**
- `channelType`, `type`, `displayName`, `isDefault`, `status`
- `settings` (`Record<string, string | null>`) — this is now the **only** place for provider credentials and config

**New Discovery Endpoints (AllowAnonymous, Cache-Control 1hr):**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/channels/providers/available` | GET | Returns all channels with their providers and settings schemas |
| `GET /api/channels/providers/available/{ProviderType}` | GET | Returns a single provider's settings schema |

### Discovery API Response Shape

`GET /api/channels/providers/available` returns:
```json
{
  "channels": [
    {
      "channelType": "email",
      "displayName": "Email",
      "providers": [
        {
          "type": "mailjet",
          "displayName": "Mailjet",
          "description": "Transactional and marketing email provider",
          "settings": [
            {
              "key": "apiKey",
              "displayName": "API Key",
              "description": null,
              "fieldType": "secret",
              "isRequired": true,
              "placeholder": "Your Mailjet API key",
              "defaultValue": null
            },
            {
              "key": "secretKey",
              "displayName": "API Secret",
              "fieldType": "secret",
              "isRequired": true,
              "placeholder": "Your Mailjet API secret"
            },
            {
              "key": "fromAddress",
              "displayName": "From Email",
              "fieldType": "email",
              "isRequired": true,
              "placeholder": "noreply@yourcompany.com"
            },
            {
              "key": "fromName",
              "displayName": "From Name",
              "fieldType": "text",
              "isRequired": false,
              "placeholder": "Your Company"
            },
            {
              "key": "sandboxMode",
              "displayName": "Sandbox Mode",
              "description": "Send emails in test mode without actual delivery",
              "fieldType": "boolean",
              "isRequired": false,
              "defaultValue": "false"
            }
          ]
        }
      ]
    }
  ]
}
```

**`fieldType` enum values:** `text`, `secret`, `email`, `url`, `json`, `number`, `boolean`

### Provider Settings by Type (for reference)

| Provider | Channel | Required Settings | Optional Settings |
|----------|---------|-------------------|-------------------|
| Mailjet | Email | `apiKey`, `secretKey`, `fromAddress` | `fromName`, `sandboxMode` |
| SendGrid | Email | `apiKey`, `fromAddress` | `fromName` |
| FCM | Push | `projectId`, `credentialJson` | — |
| APNs | Push | `keyId`, `teamId`, `bundleId`, `privateKey` | `environment` |
| Twilio | SMS | `accountSid`, `authToken`, `fromNumber` | — |
| OneSignal | Push | `appId`, `apiKey` | — |

---

## What Needs to Change in the Frontend

### 1. Regenerate the OpenAPI Client

The `openapi.json` is outdated. Fetch the latest spec from the running backend and regenerate:

```bash
pnpm openapi:gen
```

This will:
- Remove `apiKey`, `secretKey`, `fromAddress`, `endpoint`, `region` from generated `CreateProviderRequest`, `UpdateProviderRequest`, `ProviderResponse` schemas
- Add new hooks: `useGetAvailableProvidersEndpoint()` and `useGetProviderSchemaEndpoint()`
- Add new schemas: `AvailableProvidersResponse`, `ChannelDefinitionResponse`, `ProviderDefinitionResponse`, `ProviderSettingDefinitionResponse`

### 2. Rewrite Create Provider Dialog

**File:** `src/app/dashboard/providers/components/create-provider-dialog.tsx`

**Current problems:**
- Hardcoded `apiKey` and `secretKey` as top-level password fields
- Channel-specific fields via `switch` statement (fromAddress, endpoint, region)
- Manual custom settings section with add/remove key-value pairs
- Uses vanilla `FormData.get()` instead of `react-hook-form`

**Target implementation:**

1. **Fetch the provider schema** using the discovery API when the user selects a provider type:
   ```tsx
   const { data: availableProviders } = useGetAvailableProvidersEndpoint();
   ```

2. **Auto-select channel type** — when user picks a provider, look up its channel from the discovery data. The channel-provider mapping is defined by the backend, so the frontend shouldn't maintain its own mapping.

3. **Dynamically render settings fields** from `provider.settings` array. Map `fieldType` to input types:
   | `fieldType` | Input Component |
   |-------------|-----------------|
   | `text` | `<Input type="text" />` |
   | `secret` | `<Input type="password" />` |
   | `email` | `<Input type="email" />` |
   | `url` | `<Input type="url" />` |
   | `json` | `<Textarea />` (or code editor) |
   | `number` | `<Input type="number" />` |
   | `boolean` | `<Switch />` or `<Checkbox />` |

4. **Use `react-hook-form` + Zod** — build a Zod schema dynamically from the provider's settings definition:
   ```tsx
   const buildSettingsSchema = (settings: ProviderSettingDefinitionResponse[]) => {
     const shape: Record<string, z.ZodType> = {};
     for (const s of settings) {
       let field = z.string();
       if (s.isRequired) {
         field = field.min(1, `${s.displayName} is required`);
       } else {
         field = field.optional();
       }
       shape[s.key] = field;
     }
     return z.object(shape);
   };
   ```

5. **Submit all values through `settings`** dictionary — no more top-level `apiKey`/`secretKey`:
   ```tsx
   const payload: CreateProviderRequest = {
     channelType: selectedChannel,
     type: selectedProvider,
     displayName: formValues.displayName,
     settings: formValues.settings, // { apiKey: "...", secretKey: "...", fromAddress: "..." }
   };
   ```

6. **Remove** the hardcoded `providerLabels` and `channelLabels` maps — use `displayName` from the discovery response.

7. **Remove** the manual "Additional Settings" key-value add/remove section — all settings are now schema-driven.

### 3. Rewrite Update Provider Dialog

**File:** `src/app/dashboard/providers/components/update-provider-dialog.tsx`

Same approach as Create, with these additions:

- Pre-populate form from `provider.settings` (the existing key-value pairs from the backend)
- For `secret` field types, show a placeholder like "Enter new value to update" (secrets are not returned by the API)
- Only send settings that the user actually changed or filled in
- The dynamic schema should mark required fields that already have a value in `provider.settings` as satisfied

### 4. Update Provider Card Display

**File:** `src/app/dashboard/providers/components/provider-card.tsx`

- Remove any display of `provider.fromAddress`, `provider.endpoint`, `provider.region` — these no longer exist
- If you want to show the "from address" or other non-secret settings on the card, read from `provider.settings["fromAddress"]` etc.
- Use the discovery data to know which settings are `secret` (don't display those)

### 5. Update Provider Info Component

**File:** `src/app/dashboard/providers/components/provider-info.tsx`

- Use discovery data instead of hardcoded provider descriptions
- Show the required settings list from the schema

### 6. Consider a Shared Dynamic Settings Form Component

Since create and update dialogs will share the same dynamic form logic, extract a reusable component:

```
src/app/dashboard/providers/components/provider-settings-form.tsx
```

This component should:
- Accept `settings: ProviderSettingDefinitionResponse[]` (from discovery API)
- Accept optional `initialValues: Record<string, string | null>` (for edit mode)
- Render the appropriate input for each `fieldType`
- Integrate with `react-hook-form` via `useFormContext` or accept a form instance
- Handle validation via the dynamically-built Zod schema

### 7. Caching Strategy for Discovery Data

The discovery endpoints return `Cache-Control: public, max-age=3600`. On the React Query side:

```tsx
const { data: availableProviders } = useGetAvailableProvidersEndpoint({
  query: {
    staleTime: 60 * 60 * 1000, // 1 hour — matches backend cache header
    gcTime: 60 * 60 * 1000,
  },
});
```

This is static metadata that changes only on backend deployment, so aggressive caching is appropriate.

---

## Files to Modify

| File | Action |
|------|--------|
| `openapi.json` | Regenerate from backend (`pnpm openapi:gen`) |
| `src/api/generated/*` | Auto-regenerated by `pnpm orval` |
| `src/app/dashboard/providers/components/create-provider-dialog.tsx` | Rewrite to use discovery API + dynamic form |
| `src/app/dashboard/providers/components/update-provider-dialog.tsx` | Rewrite to use discovery API + dynamic form |
| `src/app/dashboard/providers/components/provider-card.tsx` | Remove hardcoded field references |
| `src/app/dashboard/providers/components/provider-info.tsx` | Use discovery data for descriptions |
| `src/app/dashboard/providers/components/provider-settings-form.tsx` | **New** — shared dynamic settings form |

## Important Notes

- The backend **validates** settings on create/update against the same schema — if a required setting is missing, the backend returns a 400 with the field name as the error property name
- Provider type + channel type combination is also validated server-side — invalid combos (e.g., FCM + Email) are rejected
- The `settings` dictionary keys match exactly what the discovery API returns (e.g., `"apiKey"`, `"secretKey"`, `"fromAddress"`, `"projectId"`)
- Backend validation error property names match the setting keys (e.g., `"apiKey": "'API Key' is required for Mailjet."`)

# Task 03: Rewrite Create Provider Dialog

## File

`src/app/dashboard/providers/components/create-provider-dialog.tsx`

## What to Remove

- `providerLabels` hardcoded map (lines 34–41)
- `channelLabels` hardcoded map (lines 43–48)
- `renderChannelFields()` switch statement (lines 90–122)
- Manual `FormData.get()` calls in submit handler
- The manual "Additional Settings" key-value add/remove section
- The hardcoded `apiKey` and `apiSecret` password fields

## New Implementation

### 1. Use `react-hook-form` + Zod

Replace raw `FormData` handling with a proper form:

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { displayName: '', settings: {} },
});
```

The schema must be rebuilt dynamically when the selected provider changes (using `buildSettingsSchema` from Task 02).

### 2. Provider Selection Flow

Use discovery data from `useAvailableProviders()` (Task 01):

1. **Step 1 — Pick a provider**: Show a grouped list/grid of providers organized by channel. Each channel is a section header; providers are selectable items showing `displayName` and `description`.
2. **Auto-set channel**: When the user selects a provider, look up its channel via `getChannelForProvider(type)` and set it automatically. No manual channel dropdown needed.
3. **Step 2 — Configure settings**: Render `<ProviderSettingsForm settings={...} />` with the selected provider's settings schema.

### 3. Display Name

- Keep the `displayName` text input above the settings form.
- Default to the provider's `displayName` from discovery (e.g., "Mailjet") but allow override.

### 4. Submit Handler

Build the payload using only `settings` — no top-level credential fields:

```tsx
const onSubmit = (values: FormValues) => {
  const payload: CreateProviderRequest = {
    organizationId: orgId,
    channelType: selectedChannel,
    type: selectedProviderType,
    displayName: values.displayName || undefined,
    settings: values.settings,
  };
  createMutation.mutate({ data: payload });
};
```

### 5. Error Handling

The backend returns validation errors with property names matching setting keys (e.g., `"apiKey": "'API Key' is required for Mailjet."`). Map these to form field errors:

```tsx
onError: (error) => {
  if (error?.errors) {
    for (const [key, message] of Object.entries(error.errors)) {
      form.setError(`settings.${key}`, { message });
    }
  }
}
```

### 6. Dialog Structure

Keep the same `Dialog` / `DialogContent` shell. The internal content changes to:
- Provider picker (when no provider selected)
- Form with `displayName` + `ProviderSettingsForm` + submit button (when provider selected)
- Back button to return to provider picker

## Acceptance Criteria

- No hardcoded provider or channel labels remain.
- Provider list is populated entirely from discovery API.
- Settings fields render dynamically based on selected provider.
- Form validation works (required fields, error messages).
- Successful creation invalidates the providers list query.
- Backend validation errors surface on the correct form fields.

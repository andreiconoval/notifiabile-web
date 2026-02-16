# Task 04: Rewrite Update Provider Dialog

## File

`src/app/dashboard/providers/components/update-provider-dialog.tsx`

## What to Remove

Same hardcoded items as Task 03:
- `providerLabels` and `channelLabels` maps
- `renderChannelFields()` switch statement
- Manual `FormData.get()` calls
- Hardcoded `apiKey`, `apiSecret`, `fromAddress`, `endpoint`, `region` fields
- Manual "Additional Settings" section

## New Implementation

### 1. Use `react-hook-form` + Zod

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {
    displayName: provider.displayName ?? '',
    settings: provider.settings ?? {},
  },
});
```

Use `buildUpdateSettingsSchema()` from Task 02 — required fields that already have values in `provider.settings` are treated as satisfied (optional in the schema).

### 2. Pre-populate from `provider.settings`

- Pass `initialValues={provider.settings}` and `isUpdate={true}` to `<ProviderSettingsForm>`.
- Secret fields won't have values returned by the API — show placeholder "Enter new value to update".
- Non-secret fields are pre-filled with their current values.

### 3. Provider Type is Read-Only

The dialog already knows the provider's `type` and `channelType`. Use `useAvailableProviders().getSettings(provider.type)` to get the schema. No provider picker needed — just show the provider name as a header.

### 4. Submit Only Changed/Filled Settings

```tsx
const onSubmit = (values: FormValues) => {
  // Filter out empty strings for secret fields that weren't changed
  const cleanedSettings: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(values.settings)) {
    if (value !== undefined && value !== '') {
      cleanedSettings[key] = value;
    }
  }

  const payload: UpdateProviderRequest = {
    organizationId: orgId,
    displayName: values.displayName || undefined,
    settings: cleanedSettings,
  };
  updateMutation.mutate({ id: provider.id, data: payload });
};
```

### 5. Status & Default Toggle

Keep the existing status toggle and "Make Default" functionality — these are part of `UpdateProviderRequest` and remain unchanged.

### 6. Error Handling

Same approach as Task 03 — map backend validation errors to `settings.{key}` form fields.

## Acceptance Criteria

- No hardcoded field references remain.
- Settings form is driven by discovery API schema for the provider's type.
- Existing non-secret values are pre-populated.
- Secret fields show "Enter new value to update" placeholder.
- Empty/unchanged secret fields are excluded from the payload.
- Status and default toggles still work.
- Backend validation errors surface correctly.

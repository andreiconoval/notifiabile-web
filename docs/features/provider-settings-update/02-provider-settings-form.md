# Task 02: Create `ProviderSettingsForm` Component

## Why

Both the Create and Update dialogs need to render the same dynamic settings fields. A shared component avoids duplication and ensures consistent behavior.

## File

`src/app/dashboard/providers/components/provider-settings-form.tsx` (new)

## Props

```ts
interface ProviderSettingsFormProps {
  /** Settings schema from discovery API */
  settings: ProviderSettingDefinitionResponse[];
  /** Pre-filled values for edit mode (from provider.settings) */
  initialValues?: Record<string, string | null>;
  /** Whether this is an update (affects secret field behavior) */
  isUpdate?: boolean;
}
```

## Requirements

### 1. Dynamic Field Rendering

Map each `ProviderSettingDefinitionResponse` to the appropriate input based on `fieldType`:

| `fieldType` | Component | Notes |
|-------------|-----------|-------|
| `text` | `<Input type="text" />` | Standard text input |
| `secret` | `<Input type="password" />` | Show/hide toggle via eye icon. In update mode: placeholder "Enter new value to update" |
| `email` | `<Input type="email" />` | Standard email input |
| `url` | `<Input type="url" />` | Standard URL input |
| `json` | `<Textarea />` | Monospace font, taller default height |
| `number` | `<Input type="number" />` | Standard number input |
| `boolean` | `<Switch />` | From ShadCN UI, with label beside it |

### 2. Integration with `react-hook-form`

- Use `useFormContext()` so the parent form owns the `FormProvider`.
- Register each field under `settings.{key}` path (e.g., `settings.apiKey`, `settings.fromAddress`).
- Use ShadCN `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormDescription>`, `<FormMessage>` wrappers.

### 3. Dynamic Zod Validation

Export a helper to build a Zod schema from the settings array:

```ts
export function buildSettingsSchema(settings: ProviderSettingDefinitionResponse[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const s of settings) {
    if (s.fieldType === 'boolean') {
      shape[s.key!] = s.isRequired ? z.string() : z.string().optional();
    } else {
      let field = z.string();
      if (s.isRequired) {
        field = field.min(1, `${s.displayName} is required`);
      }
      shape[s.key!] = s.isRequired ? field : field.optional().or(z.literal(''));
    }
  }
  return z.object(shape);
}
```

For update mode, export a variant that makes all fields optional (since existing values are already saved):

```ts
export function buildUpdateSettingsSchema(
  settings: ProviderSettingDefinitionResponse[],
  existingSettings: Record<string, string | null>,
) {
  // Required fields that already have a value in existingSettings become optional
  // Required fields without a value stay required
  // Secret fields are always optional in update mode
}
```

### 4. Field Layout

- Render required fields first, then optional fields.
- Show `description` as `<FormDescription>` below the input when present.
- Show `placeholder` on the input.
- For `defaultValue`, set it as the form default if no `initialValues` are provided.

## Acceptance Criteria

- Component renders correct input types for all 7 `fieldType` values.
- Required field validation works (shows error messages).
- In update mode, secret fields show placeholder text and are optional.
- Boolean fields render as switches with correct default state.
- JSON fields render as textareas with monospace styling.
- Integrates with parent `FormProvider` via `useFormContext`.

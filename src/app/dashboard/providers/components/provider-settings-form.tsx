'use client';

import { useState } from 'react';
import { useFormContext, type Control, type FieldValues } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { ProviderSettingDefinitionResponse } from '@/api/generated/schemas';
import { SettingFieldType } from '@/api/generated/schemas';

// ---------------------------------------------------------------------------
// Dynamic Zod schema builders
// ---------------------------------------------------------------------------

export function buildSettingsSchema(settings: ProviderSettingDefinitionResponse[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const s of settings) {
    if (!s.key) continue;
    if (s.fieldType === SettingFieldType.Boolean) {
      shape[s.key] = z.string().optional();
    } else if (s.isRequired) {
      shape[s.key] = z.string().min(1, `${s.displayName ?? s.key} is required`);
    } else {
      shape[s.key] = z.string().optional().or(z.literal(''));
    }
  }
  return z.object(shape);
}

export function buildUpdateSettingsSchema(
  settings: ProviderSettingDefinitionResponse[],
  existingSettings: Record<string, string | null>,
) {
  const shape: Record<string, z.ZodType> = {};
  for (const s of settings) {
    if (!s.key) continue;
    const hasExisting = existingSettings[s.key] != null && existingSettings[s.key] !== '';
    const isSecret = s.fieldType === SettingFieldType.Secret;

    if (isSecret || hasExisting) {
      // Secrets are never returned — always optional in update mode.
      // Non-secret required fields that already have a value are also optional.
      shape[s.key] = z.string().optional().or(z.literal(''));
    } else if (s.isRequired) {
      shape[s.key] = z.string().min(1, `${s.displayName ?? s.key} is required`);
    } else {
      shape[s.key] = z.string().optional().or(z.literal(''));
    }
  }
  return z.object(shape);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProviderSettingsFormProps {
  /** Settings schema from the discovery API */
  settings: ProviderSettingDefinitionResponse[];
  /** Pre-filled values for edit mode (from provider.settings) */
  initialValues?: Record<string, string | null>;
  /** Affects secret field placeholder and validation */
  isUpdate?: boolean;
}

export function ProviderSettingsForm({
  settings,
  initialValues,
  isUpdate = false,
}: ProviderSettingsFormProps) {
  const { control } = useFormContext();

  // Sort: required fields first, then optional
  const sorted = [...settings].sort((a, b) => {
    if (a.isRequired && !b.isRequired) return -1;
    if (!a.isRequired && b.isRequired) return 1;
    return 0;
  });

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No settings required for this provider.</p>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((s) => {
        if (!s.key) return null;
        const fieldName = `settings.${s.key}`;
        return (
          <SettingField
            key={s.key}
            definition={s}
            fieldName={fieldName}
            control={control}
            initialValue={initialValues?.[s.key] ?? undefined}
            isUpdate={isUpdate}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual field renderer
// ---------------------------------------------------------------------------

function SettingField({
  definition,
  fieldName,
  control,
  initialValue,
  isUpdate,
}: {
  definition: ProviderSettingDefinitionResponse;
  fieldName: string;
  control: Control<FieldValues>;
  initialValue?: string;
  isUpdate: boolean;
}) {
  const { key, displayName, description, fieldType, isRequired, placeholder } = definition;

  if (fieldType === SettingFieldType.Boolean) {
    return (
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>{displayName ?? key}</FormLabel>
              {description && <FormDescription>{description}</FormDescription>}
            </div>
            <FormControl>
              <Switch
                checked={field.value === 'true'}
                onCheckedChange={(checked) => field.onChange(checked ? 'true' : 'false')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (fieldType === SettingFieldType.Secret) {
    return (
      <SecretField
        fieldName={fieldName}
        control={control}
        displayName={displayName ?? key ?? ''}
        description={description}
        placeholder={
          isUpdate ? 'Enter new value to update' : (placeholder ?? undefined)
        }
        isRequired={isRequired}
      />
    );
  }

  if (fieldType === SettingFieldType.Json) {
    return (
      <FormField
        control={control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {displayName ?? key}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[100px] font-mono text-xs"
                placeholder={placeholder ?? undefined}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // text | email | url | number
  const inputType = fieldTypeToInputType(fieldType);

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {displayName ?? key}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={inputType}
              placeholder={placeholder ?? undefined}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Secret field with show/hide toggle
// ---------------------------------------------------------------------------

function SecretField({
  fieldName,
  control,
  displayName,
  description,
  placeholder,
  isRequired,
}: {
  fieldName: string;
  control: Control<FieldValues>;
  displayName: string;
  description?: string | null;
  placeholder?: string;
  isRequired?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {displayName}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <div className="relative">
            <FormControl>
              <Input
                type={visible ? 'text' : 'password'}
                placeholder={placeholder}
                className="pr-10"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
            >
              {visible ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldTypeToInputType(fieldType?: SettingFieldType): string {
  switch (fieldType) {
    case SettingFieldType.Email:
      return 'email';
    case SettingFieldType.Url:
      return 'url';
    case SettingFieldType.Number:
      return 'number';
    default:
      return 'text';
  }
}

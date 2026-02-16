'use client';

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useQueryClient } from '@tanstack/react-query';
import type {
  ErrorResponse,
  ProviderResponse,
  UpdateProviderRequest,
} from '@/api/generated/schemas';
import {
  getListProvidersEndpointQueryKey,
  useDeleteProviderEndpoint,
  useUpdateProviderEndpoint,
} from '@/api/generated/notifiable.web';
import { useAuth } from '@/contexts/AuthContext';
import { useAvailableProviders } from '../hooks/use-available-providers';
import { buildUpdateSettingsSchema, ProviderSettingsForm } from './provider-settings-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UpdateProviderDialogProps = {
  provider: ProviderResponse;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UpdateProviderDialog({
  provider,
  open,
  onOpenChange,
  trigger,
}: UpdateProviderDialogProps) {
  const queryClient = useQueryClient();
  const { selectedOrg } = useAuth();
  const { getProvider, getChannelForProvider } = useAvailableProviders();
  const { mutateAsync: updateProvider } = useUpdateProviderEndpoint();
  const { mutateAsync: deleteProvider } = useDeleteProviderEndpoint();
  const [dialogOpen, setDialogOpen] = useState(false);

  const providerDef = provider.type ? getProvider(provider.type) : undefined;
  const channelDef = provider.type ? getChannelForProvider(provider.type) : undefined;
  const settingsDef = providerDef?.settings ?? [];

  const existingSettings = useMemo<Record<string, string | null>>(
    () => (provider.settings as Record<string, string | null>) ?? {},
    [provider.settings],
  );

  // Build Zod schema — required fields with existing values become optional
  const schema = useMemo(() => {
    const settingsSchema = settingsDef.length > 0
      ? buildUpdateSettingsSchema(settingsDef, existingSettings)
      : z.record(z.string(), z.string().optional());
    return z.object({
      displayName: z.string().optional(),
      settings: settingsSchema,
    });
  }, [settingsDef, existingSettings]);

  // Build initial form values from existing settings
  const defaultValues = useMemo(() => {
    const settings: Record<string, string> = {};
    for (const s of settingsDef) {
      if (s.key) {
        settings[s.key] = existingSettings[s.key] ?? s.defaultValue ?? '';
      }
    }
    return {
      displayName: provider.displayName ?? '',
      settings,
    };
  }, [settingsDef, existingSettings, provider.displayName]);

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const dialogProps =
    onOpenChange !== undefined
      ? { open, onOpenChange }
      : { open: dialogOpen, onOpenChange: setDialogOpen };

  const closeDialog = () => (onOpenChange ?? setDialogOpen)(false);

  async function onSubmit(values: Record<string, unknown>) {
    if (!provider.id) return;

    // Only send settings that were filled in (skip empty strings for secrets)
    const rawSettings = (values.settings ?? {}) as Record<string, string>;
    const cleanedSettings: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(rawSettings)) {
      if (value !== undefined && value !== '') {
        cleanedSettings[key] = value;
      }
    }

    try {
      const payload: UpdateProviderRequest = {
        organizationId: selectedOrg?.id,
        displayName: (values.displayName as string) || undefined,
        settings: Object.keys(cleanedSettings).length > 0 ? cleanedSettings : undefined,
      };

      await updateProvider({ id: provider.id, data: payload });
      await queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() });
      toast.success('Provider updated successfully');
      closeDialog();
    } catch (err: unknown) {
      const error = err as ErrorResponse | undefined;
      if (error?.errors) {
        for (const [key, messages] of Object.entries(error.errors)) {
          const message = messages?.[0] ?? 'Invalid value';
          form.setError(`settings.${key}`, { message });
        }
      } else {
        toast.error(error?.message ?? 'Failed to update provider');
      }
    }
  }

  const handleDelete = async () => {
    if (!provider.id) return;
    if (!window.confirm('Delete this provider? This cannot be undone.')) return;
    try {
      await deleteProvider({ id: provider.id, data: { organizationId: selectedOrg?.id } });
      await queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() });
      toast.success('Provider deleted successfully');
      closeDialog();
    } catch (err) {
      console.error('Failed to delete provider:', err);
      toast.error('Failed to delete provider');
    }
  };

  return (
    <Dialog {...dialogProps}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Update {providerDef?.displayName ?? provider.displayName ?? 'Provider'}
          </DialogTitle>
          <DialogDescription>
            {channelDef?.displayName && (
              <span className="mr-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                {channelDef.displayName}
              </span>
            )}
            {providerDef?.description ?? 'Edit provider settings'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={providerDef?.displayName ?? 'Provider name'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ProviderSettingsForm
                settings={settingsDef}
                initialValues={existingSettings}
                isUpdate
              />

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Your API credentials are encrypted and stored securely.
                </p>
              </div>
            </div>

            <DialogFooter>
              <div className="flex w-full items-center justify-between gap-2">
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

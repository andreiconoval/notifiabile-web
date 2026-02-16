'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
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
import {
  getListProvidersEndpointQueryKey,
  useCreateProviderEndpoint,
} from '@/api/generated/notifiable.web';
import type {
  CreateProviderRequest,
  ErrorResponse,
  NotificationChannelType,
  ProviderDefinitionResponse,
  ProviderType,
} from '@/api/generated/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useAvailableProviders } from '../hooks/use-available-providers';
import { buildSettingsSchema, ProviderSettingsForm } from './provider-settings-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
  onProviderCreated: () => void;
  trigger?: React.ReactNode;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateProviderDialog({
  open,
  onOpenChange,
  orgId,
  onProviderCreated,
  trigger,
}: CreateProviderDialogProps) {
  const queryClient = useQueryClient();
  const { channels, isLoading: discoveryLoading, getChannelForProvider } = useAvailableProviders();
  const { mutateAsync: createProvider } = useCreateProviderEndpoint();

  const [selectedProvider, setSelectedProvider] = useState<ProviderDefinitionResponse | null>(null);
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderType | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannelType | null>(null);

  // Build Zod schema dynamically for the selected provider
  const schema = useMemo(() => {
    const settingsSchema = selectedProvider?.settings
      ? buildSettingsSchema(selectedProvider.settings)
      : z.record(z.string(), z.string().optional());
    return z.object({
      displayName: z.string().optional(),
      settings: settingsSchema,
    });
  }, [selectedProvider]);

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      displayName: '',
      settings: {} as Record<string, string>,
    },
  });

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSelectedProvider(null);
        setSelectedProviderType(null);
        setSelectedChannel(null);
        form.reset({ displayName: '', settings: {} });
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, form],
  );

  // When user picks a provider from the picker
  const handleSelectProvider = useCallback(
    (provider: ProviderDefinitionResponse) => {
      if (!provider.type) return;

      const channel = getChannelForProvider(provider.type);
      setSelectedProvider(provider);
      setSelectedProviderType(provider.type);
      setSelectedChannel((channel?.channelType as NotificationChannelType) ?? null);

      // Build default values from the provider schema
      const defaults: Record<string, string> = {};
      for (const s of provider.settings ?? []) {
        if (s.key) {
          defaults[s.key] = s.defaultValue ?? '';
        }
      }
      form.reset({
        displayName: provider.displayName ?? '',
        settings: defaults,
      });
    },
    [getChannelForProvider, form],
  );

  const handleBack = useCallback(() => {
    setSelectedProvider(null);
    setSelectedProviderType(null);
    setSelectedChannel(null);
    form.reset({ displayName: '', settings: {} });
  }, [form]);

  async function onSubmit(values: Record<string, unknown>) {
    if (!orgId) {
      toast.error('No organization selected');
      return;
    }
    if (!selectedProviderType || !selectedChannel) return;

    try {
      const payload: CreateProviderRequest = {
        organizationId: orgId,
        channelType: selectedChannel,
        type: selectedProviderType,
        displayName: (values.displayName as string) || undefined,
        settings: values.settings as Record<string, string | null>,
      };

      await createProvider({ data: payload });
      await queryClient.invalidateQueries({
        queryKey: getListProvidersEndpointQueryKey(),
      });
      toast.success('Provider configured successfully');
      handleOpenChange(false);
      onProviderCreated();
    } catch (err: unknown) {
      const error = err as ErrorResponse | undefined;
      if (error?.errors) {
        for (const [key, messages] of Object.entries(error.errors)) {
          const message = messages?.[0] ?? 'Invalid value';
          form.setError(`settings.${key}`, { message });
        }
      } else {
        toast.error(error?.message ?? 'Failed to configure provider');
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!selectedProvider ? (
          // ------- Step 1: Provider Picker -------
          <>
            <DialogHeader>
              <DialogTitle>Add Provider</DialogTitle>
              <DialogDescription>Choose a notification delivery provider</DialogDescription>
            </DialogHeader>

            {discoveryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {channels.map((channel) => (
                  <div key={channel.channelType}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {channel.displayName}
                    </h3>
                    <div className="grid gap-2">
                      {(channel.providers ?? []).map((provider) => (
                        <button
                          key={provider.type}
                          type="button"
                          className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                          onClick={() => handleSelectProvider(provider)}
                        >
                          <span className="font-medium">{provider.displayName}</span>
                          {provider.description && (
                            <span className="text-sm text-muted-foreground">
                              {provider.description}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {channels.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No providers available.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          // ------- Step 2: Configure Settings -------
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>Configure {selectedProvider.displayName}</DialogTitle>
                  <DialogDescription>
                    {selectedProvider.description ?? 'Enter provider settings'}
                  </DialogDescription>
                </div>
              </div>
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
                            placeholder={selectedProvider.displayName ?? 'Provider name'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ProviderSettingsForm settings={selectedProvider.settings ?? []} />

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Your API credentials are encrypted and stored securely.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Configure Provider
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Save, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import {
  NotificationChannelType,
  ProviderResponse,
  ProviderType,
  UpdateProviderRequest,
} from '@/api/generated/schemas';
import {
  getListProvidersEndpointQueryKey,
  useDeleteProviderEndpoint,
  useUpdateProviderEndpoint,
} from '@/api/generated/notifiable.web';

const providerLabels: Record<ProviderType, string> = {
  [ProviderType.Mailjet]: 'Mailjet',
  [ProviderType.SendGrid]: 'SendGrid',
  [ProviderType.FCM]: 'FCM (Firebase)',
  [ProviderType.APNs]: 'APNs (Apple)',
  [ProviderType.Twilio]: 'Twilio',
  [ProviderType.OneSignal]: 'OneSignal',
};

const channelLabels: Record<NotificationChannelType, string> = {
  [NotificationChannelType.Email]: 'Email',
  [NotificationChannelType.Sms]: 'SMS',
  [NotificationChannelType.Push]: 'Push',
  [NotificationChannelType.Internal]: 'Internal',
};

type UpdateProviderDialogProps = {
  provider: ProviderResponse;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function UpdateProviderDialog({
  provider,
  open,
  onOpenChange,
  trigger,
}: UpdateProviderDialogProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProviderType>(
    (provider.type as ProviderType) ?? ProviderType.Mailjet,
  );
  const [channelType, setChannelType] = useState<NotificationChannelType>(
    (provider.channelType as NotificationChannelType) ?? NotificationChannelType.Email,
  );
  const { mutateAsync: updateProvider } = useUpdateProviderEndpoint();
  const { mutateAsync: deleteProvider } = useDeleteProviderEndpoint();
  const [settings, setSettings] = useState<Record<string, string>>(
    provider.settings
      ? Object.entries(provider.settings).reduce<Record<string, string>>((acc, [k, v]) => {
          acc[k] = v ?? '';
          return acc;
        }, {})
      : {},
  );

  const placeholder = useMemo(
    () => provider.displayName ?? providerLabels[selectedType] ?? 'Provider',
    [provider.displayName, selectedType],
  );

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addSetting = () => {
    const newKey = `key_${Object.keys(settings).length + 1}`;
    setSettings((prev) => ({ ...prev, [newKey]: '' }));
  };
  const removeSetting = (key: string) => {
    setSettings((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const renderChannelFields = () => {
    switch (channelType) {
      case NotificationChannelType.Email:
        return (
          <div className="space-y-2">
            <Label htmlFor="fromAddress">From Address</Label>
            <Input
              id="fromAddress"
              name="fromAddress"
              placeholder="notifications@yourdomain.com"
              defaultValue={provider.fromAddress ?? ''}
            />
          </div>
        );
      case NotificationChannelType.Push:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                name="endpoint"
                placeholder="https://fcm.googleapis.com"
                defaultValue={provider.endpoint ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                name="region"
                placeholder="us-east-1"
                defaultValue={provider.region ?? ''}
              />
            </div>
          </>
        );
      case NotificationChannelType.Sms:
        return (
          <div className="space-y-2">
            <Label htmlFor="fromAddress">Sender (number or ID)</Label>
            <Input
              id="fromAddress"
              name="fromAddress"
              placeholder="+15551234567 or MY-APP"
              defaultValue={provider.fromAddress ?? ''}
            />
          </div>
        );
      default:
        return null;
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!provider.id) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as ProviderType;
    const selectedChannel = (formData.get('channelType') as NotificationChannelType) ?? channelType;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;
    const fromAddress = formData.get('fromAddress') as string;
    const endpoint = formData.get('endpoint') as string;
    const region = formData.get('region') as string;

    try {
      const payload: UpdateProviderRequest = {
        displayName: name,
        apiKey: apiKey || null,
        secretKey: apiSecret || null,
        fromAddress: fromAddress || null,
        endpoint: endpoint || null,
        region: region || null,
        // channel/type are immutable in this API; if needed, include settings
        settings:
          Object.keys(settings).length > 0
            ? Object.entries(settings).reduce<Record<string, string | null>>((acc, [k, v]) => {
                acc[k] = v || null;
                return acc;
              }, {})
            : undefined,
      };

      await updateProvider({ id: provider.id, data: payload });
      await queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() });
      toast.success('Provider updated successfully');
      (onOpenChange ?? setDialogOpen)(false);
    } catch (err) {
      console.error('Failed to update provider:', err);
      toast.error('Failed to update provider');
    }
  }

  const dialogProps =
    onOpenChange !== undefined
      ? { open, onOpenChange }
      : { open: dialogOpen, onOpenChange: setDialogOpen };

  const handleDelete = async () => {
    if (!provider.id) return;
    if (!window.confirm('Delete this provider? This cannot be undone.')) return;
    try {
      await deleteProvider({ id: provider.id });
      await queryClient.invalidateQueries({ queryKey: getListProvidersEndpointQueryKey() });
      toast.success('Provider deleted successfully');
      (onOpenChange ?? setDialogOpen)(false);
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
          <DialogTitle>Update Provider</DialogTitle>
          <DialogDescription>Edit provider credentials or metadata</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Provider Type</Label>
              <Select
                name="type"
                defaultValue={selectedType}
                onValueChange={(value) => setSelectedType(value as ProviderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProviderType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {providerLabels[value as ProviderType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelType">Channel</Label>
              <Select
                name="channelType"
                defaultValue={channelType}
                onValueChange={(value) => setChannelType(value as NotificationChannelType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(NotificationChannelType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {channelLabels[value as NotificationChannelType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                name="name"
                placeholder={placeholder}
                defaultValue={provider.displayName ?? ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Enter your API key"
                defaultValue={''} //provider.apiKey ??
              />
            </div>
            {renderChannelFields()}
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                name="apiSecret"
                type="password"
                placeholder="Enter your API secret (if applicable)"
                defaultValue={''} // provider.secretKey ??
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Settings</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSetting}>
                  Add Setting
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setSettings((prev) => {
                          const { [key]: _, ...rest } = prev;
                          return { ...rest, [newKey]: value };
                        });
                      }}
                      placeholder="Key"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleSettingChange(key, e.target.value)}
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeSetting(key)}
                      aria-label={`Remove ${key}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {Object.keys(settings).length === 0 && (
                  <p className="text-xs text-gray-500">No settings added yet.</p>
                )}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (onOpenChange ?? setDialogOpen)(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

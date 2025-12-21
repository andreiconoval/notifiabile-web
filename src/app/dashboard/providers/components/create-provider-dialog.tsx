import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
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
  CreateProviderRequest,
  NotificationChannelType,
  ProviderType,
} from '@/api/generated/schemas';
import {
  getListProvidersEndpointQueryKey,
  useCreateProviderEndpoint,
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

type CreateProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
  onProviderCreated: () => void;
  trigger?: React.ReactNode;
};

export function CreateProviderDialog({
  open,
  onOpenChange,
  orgId,
  onProviderCreated,
  trigger,
}: CreateProviderDialogProps) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ProviderType>(ProviderType.Mailjet);
  const [channelType, setChannelType] = useState<NotificationChannelType>(
    NotificationChannelType.Email,
  );
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { mutateAsync: createProvider } = useCreateProviderEndpoint();

  const placeholder = useMemo(() => providerLabels[selectedType] ?? 'Provider', [selectedType]);

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
            <Input id="fromAddress" name="fromAddress" placeholder="notifications@yourdomain.com" />
          </div>
        );
      case NotificationChannelType.Push:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input id="endpoint" name="endpoint" placeholder="https://fcm.googleapis.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" placeholder="us-east-1" />
            </div>
          </>
        );
      case NotificationChannelType.Sms:
        return (
          <div className="space-y-2">
            <Label htmlFor="fromAddress">Sender (number or ID)</Label>
            <Input id="fromAddress" name="fromAddress" placeholder="+15551234567 or MY-APP" />
          </div>
        );
      default:
        return null;
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) {
      toast.error('No organization selected');
      return;
    }

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
      const payload: CreateProviderRequest = {
        organizationId: orgId,
        channelType: selectedChannel,
        type,
        displayName: name,
        apiKey: apiKey || null,
        secretKey: apiSecret || null,
        fromAddress: fromAddress || null,
        endpoint: endpoint || null,
        region: region || null,
        settings:
          Object.keys(settings).length > 0
            ? Object.entries(settings).reduce<Record<string, string | null>>((acc, [k, v]) => {
                acc[k] = v || null;
                return acc;
              }, {})
            : undefined,
      };

      await createProvider({ data: payload });
      await queryClient.invalidateQueries({
        queryKey: getListProvidersEndpointQueryKey(),
      });
      toast.success('Provider configured successfully');
      onOpenChange(false);
      onProviderCreated();
    } catch (error) {
      console.error('Failed to create provider:', error);
      toast.error('Failed to configure provider');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Provider</DialogTitle>
          <DialogDescription>Add a new notification delivery provider</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Provider Type</Label>
              <Select
                name="type"
                defaultValue={ProviderType.Mailjet}
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
              <p className="text-xs text-gray-500">Example: {providerLabels[selectedType]}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelType">Channel</Label>
              <Select
                name="channelType"
                defaultValue={NotificationChannelType.Email}
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
              <Input id="name" name="name" placeholder={placeholder} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="Enter your API key"
                required
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Configure Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

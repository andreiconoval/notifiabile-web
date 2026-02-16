import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@radix-ui/react-label';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

import { useCreateTemplateEndpoint } from '@/api/generated/notifiable.web';
import { TemplateCreateRequest, NotificationChannelType } from '@/api/generated/schemas';
import { EmailFields, InternalFields, PushFields, SMSFields } from './fields';

export default function CreateTemplateDialog({
  onTemplateCreated,
  children: trigger,
}: {
  onTemplateCreated?: () => void;
  children?: React.ReactNode;
}) {
  const { selectedOrg, selectedEnv } = useAuth();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannelType>(
    NotificationChannelType.Email,
  );

  const { mutateAsync: createTemplateApi, isError } = useCreateTemplateEndpoint();

  async function createTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedOrg) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const channel = formData.get('channel') as NotificationChannelType;

    var request: TemplateCreateRequest = {
      channelType: channel,
      code: name,
      content: {
        emailSubject: formData.get('emailSubject') as string,
        emailHtml: formData.get('emailHtml') as string,
        pushTitle: formData.get('pushTitle') as string,
        pushBody: formData.get('pushBody') as string,
        smsText: formData.get('smsText') as string,
      },
    };

    try {
      await createTemplateApi({ data: request });
      if (isError) {
        console.error('Failed to create template');
        return;
      }
      toast.success('Template created successfully');
      setCreateDialogOpen(false);
      onTemplateCreated?.();
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
  }

  const renderChannelSpecificFields = () => {
    switch (selectedChannel) {
      case NotificationChannelType.Email:
        return EmailFields();
      case NotificationChannelType.Push:
        return PushFields();
      case NotificationChannelType.Sms:
        return SMSFields();
      case NotificationChannelType.Internal:
        return InternalFields();
      default:
        return null;
    }
  };

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>Design a new notification template</DialogDescription>
        </DialogHeader>
        <form onSubmit={createTemplate}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" name="name" placeholder="Welcome Email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select
                name="channel"
                defaultValue={NotificationChannelType.Email}
                onValueChange={(v: any) => setSelectedChannel(v as NotificationChannelType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NotificationChannelType.Email}>Email</SelectItem>
                  <SelectItem value={NotificationChannelType.Push}>Push Notification</SelectItem>
                  <SelectItem value={NotificationChannelType.Sms}>SMS</SelectItem>
                  <SelectItem value={NotificationChannelType.Internal}>Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {renderChannelSpecificFields()}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Template</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

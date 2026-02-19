'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  Clock,
  Code,
  Edit,
  FileText,
  Hash,
  Mail,
  Phone,
  Send,
  Smartphone,
  Tag,
  UserCircle,
  Users,
} from 'lucide-react';
import {
  enqueueNotificationEndpoint,
  getTemplateListEndpoint,
  listAudiencesEndpoint,
  listContactsEndpoint,
} from '@/api/generated/notifiable.web';
import type {
  AudienceGroupDto,
  ContactRecord,
  EnqueueNotificationRequest,
  NotificationChannelType,
  NotificationPriority,
  RecipientSet,
  TemplateResponse,
} from '@/api/generated/schemas';
import { PRIORITY_OPTIONS } from '../constants';

interface NotificationCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
  env?: string;
  onSent?: () => void;
}

const TEMPLATE_PAGE_SIZE = 100;
const CONTACT_PAGE_SIZE = 100;

const CHANNEL_OPTIONS: { value: NotificationChannelType; label: string; icon: React.ReactNode }[] =
  [
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'sms', label: 'SMS', icon: <Phone className="h-4 w-4" /> },
    { value: 'push', label: 'Push', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'internal', label: 'In-App', icon: <UserCircle className="h-4 w-4" /> },
  ];

type RecipientMode = 'contacts' | 'audience' | 'direct';
type TemplateMode = 'existing' | 'code' | 'inline';

export default function NotificationCreateDialog({
  open,
  onOpenChange,
  orgId,
  env,
  onSent,
}: NotificationCreateDialogProps) {
  // Channel
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannelType>('email');

  // Recipients
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('contacts');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [directEmails, setDirectEmails] = useState('');
  const [directPhones, setDirectPhones] = useState('');
  const [directDeviceTokens, setDirectDeviceTokens] = useState('');
  const [directUserIds, setDirectUserIds] = useState('');

  // Template
  const [templateMode, setTemplateMode] = useState<TemplateMode>('existing');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [inlineSubject, setInlineSubject] = useState('');
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineBody, setInlineBody] = useState('');

  // Options
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [notBefore, setNotBefore] = useState('');
  const [correlationId, setCorrelationId] = useState('');
  const [metadata, setMetadata] = useState('');

  // Data loading
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [audiences, setAudiences] = useState<AudienceGroupDto[]>([]);
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !orgId) return;
    void loadRecipients();
  }, [open, orgId]);

  useEffect(() => {
    if (!open || !orgId) return;
    void loadTemplates();
  }, [open, orgId, selectedChannel]);

  async function loadRecipients() {
    setRecipientsLoading(true);
    try {
      const [contactsResponse, audiencesResponse] = await Promise.all([
        listContactsEndpoint({ skip: 0, take: CONTACT_PAGE_SIZE }),
        listAudiencesEndpoint({ page: 1, pageSize: CONTACT_PAGE_SIZE }),
      ]);
      setContacts(contactsResponse.items ?? []);
      setAudiences(audiencesResponse.items ?? []);
    } catch (error) {
      console.error('Failed to load recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setRecipientsLoading(false);
    }
  }

  async function loadTemplates() {
    setTemplatesLoading(true);
    try {
      const templateResponse = await getTemplateListEndpoint({
        channel: selectedChannel,
        page: 1,
        pageSize: TEMPLATE_PAGE_SIZE,
      });
      setTemplates(templateResponse.items ?? []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  }

  const filteredTemplates = useMemo(() => {
    if (!templates.length) return [];
    return templates.filter((template) => template.channelType === selectedChannel);
  }, [templates, selectedChannel]);

  function resetForm() {
    setSelectedChannel('email');
    setRecipientMode('contacts');
    setSelectedContacts([]);
    setSelectedAudience('');
    setDirectEmails('');
    setDirectPhones('');
    setDirectDeviceTokens('');
    setDirectUserIds('');
    setTemplateMode('existing');
    setSelectedTemplate('');
    setTemplateCode('');
    setInlineSubject('');
    setInlineTitle('');
    setInlineBody('');
    setPriority('normal');
    setNotBefore('');
    setCorrelationId('');
    setMetadata('');
  }

  function toggleContact(contactId: string) {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  }

  function parseCommaSeparated(value: string): string[] {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function sendNotification() {
    if (!orgId) {
      toast.error('Please select an organization before sending notifications.');
      return;
    }

    if (!env) {
      toast.error('Please select an environment before sending notifications.');
      return;
    }

    // Validate recipients
    const recipientSet: RecipientSet = {
      phoneNumbers: [],
      deviceTokens: [],
    };

    if (recipientMode === 'contacts') {
      if (selectedContacts.length === 0) {
        toast.error('Select at least one contact');
        return;
      }

      const selectedContactRecords = contacts.filter(
        (contact) => contact.id && selectedContacts.includes(contact.id),
      );

      const emails = Array.from(
        new Set(
          selectedContactRecords
            .map((contact) => contact.email)
            .filter((email): email is string => Boolean(email)),
        ),
      );

      const userIds = Array.from(
        new Set(
          selectedContactRecords
            .map((contact) => contact.externalId)
            .filter((ext): ext is string => Boolean(ext)),
        ),
      );

      const deviceTokens = Array.from(
        new Set(
          selectedContactRecords.flatMap((contact) => [
            contact.androidPushToken,
            contact.iosPushToken,
            contact.webPushToken,
          ]),
        ).values(),
      ).filter((token): token is string => Boolean(token));

      if (emails.length === 0 && userIds.length === 0 && deviceTokens.length === 0) {
        toast.error('Selected contacts do not contain deliverable identifiers.');
        return;
      }

      recipientSet.emails = emails;
      recipientSet.userIds = userIds;
      recipientSet.deviceTokens = deviceTokens;
    } else if (recipientMode === 'audience') {
      if (!selectedAudience) {
        toast.error('Select an audience');
        return;
      }
      recipientSet.audienceIds = [selectedAudience];
    } else if (recipientMode === 'direct') {
      const emails = parseCommaSeparated(directEmails);
      const phones = parseCommaSeparated(directPhones);
      const tokens = parseCommaSeparated(directDeviceTokens);
      const userIds = parseCommaSeparated(directUserIds);

      if (
        emails.length === 0 &&
        phones.length === 0 &&
        tokens.length === 0 &&
        userIds.length === 0
      ) {
        toast.error('Provide at least one recipient (email, phone, device token, or user ID)');
        return;
      }

      if (emails.length > 0) recipientSet.emails = emails;
      if (phones.length > 0) recipientSet.phoneNumbers = phones;
      if (tokens.length > 0) recipientSet.deviceTokens = tokens;
      if (userIds.length > 0) recipientSet.userIds = userIds;
    }

    // Validate template/content
    if (templateMode === 'existing' && !selectedTemplate) {
      toast.error('Select a template');
      return;
    }

    if (templateMode === 'code' && !templateCode.trim()) {
      toast.error('Enter a template code');
      return;
    }

    if (templateMode === 'inline' && !inlineBody.trim()) {
      toast.error('Enter notification body content');
      return;
    }

    // Parse metadata
    let metadataPayload: Record<string, string> | undefined;
    if (metadata.trim()) {
      try {
        const parsed = JSON.parse(metadata);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          metadataPayload = Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => [key, String(value)]),
          );
        } else {
          throw new Error('Metadata must be a JSON object.');
        }
      } catch {
        toast.error('Metadata must be valid JSON object');
        return;
      }
    }

    // Build request
    const payload: EnqueueNotificationRequest = {
      channelType: selectedChannel,
      recipients: recipientSet,
      priority,
    };

    if (notBefore) {
      payload.notBefore = new Date(notBefore).toISOString();
    }

    if (correlationId.trim()) {
      payload.correlationId = correlationId.trim();
    }

    if (metadataPayload) {
      payload.data = metadataPayload;
    }

    if (templateMode === 'existing') {
      payload.template = { id: selectedTemplate };
    } else if (templateMode === 'code') {
      payload.template = { code: templateCode.trim() };
    } else {
      payload.content = {
        subject: inlineSubject || undefined,
        title: inlineTitle || undefined,
        body: inlineBody,
      };
    }

    setSending(true);
    try {
      await enqueueNotificationEndpoint(payload);
      toast.success('Notification enqueued successfully!');
      onOpenChange(false);
      resetForm();
      onSent?.();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Send Notification</DialogTitle>
          <DialogDescription>Create and send a notification through any channel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Channel Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Channel</Label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNEL_OPTIONS.map((channel) => {
                const isSelected = selectedChannel === channel.value;
                return (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(channel.value);
                      setSelectedTemplate('');
                    }}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-md scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`p-2 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}
                    >
                      {channel.icon}
                    </div>
                    <span className="text-sm font-medium">{channel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipients Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Recipients</Label>
            </div>

            <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as RecipientMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contacts" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="audience" className="gap-2">
                  <Users className="h-4 w-4" />
                  Audience
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Direct Input
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="mt-4">
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {recipientsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Loading contacts...
                    </p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No contacts available.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {contacts.map((contact) => (
                        <label
                          key={contact.id}
                          htmlFor={`contact-${contact.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            id={`contact-${contact.id}`}
                            checked={selectedContacts.includes(contact.id ?? '')}
                            onCheckedChange={() => contact.id && toggleContact(contact.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {contact.firstName || contact.email || contact.id}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.email || 'No email'}
                            </p>
                          </div>
                          {contact.externalId && (
                            <Badge variant="secondary" className="text-xs">
                              {contact.externalId}
                            </Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedContacts.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}{' '}
                    selected
                  </p>
                )}
              </TabsContent>

              <TabsContent value="audience" className="mt-4">
                <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an audience..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading audiences...</div>
                    ) : audiences.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No audiences available
                      </div>
                    ) : (
                      audiences.map((audience) => (
                        <SelectItem key={audience.id ?? ''} value={audience.id ?? ''}>
                          <div className="flex items-center gap-2">
                            <span>{audience.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {audience.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="direct" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email: Email addresses */}
                  {selectedChannel === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="direct-emails" className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        Email Addresses
                      </Label>
                      <Textarea
                        id="direct-emails"
                        placeholder="user@example.com, another@example.com"
                        value={directEmails}
                        onChange={(e) => setDirectEmails(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Comma or newline separated</p>
                    </div>
                  )}

                  {/* SMS: Phone numbers */}
                  {selectedChannel === 'sms' && (
                    <div className="space-y-2">
                      <Label htmlFor="direct-phones" className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        Phone Numbers
                      </Label>
                      <Textarea
                        id="direct-phones"
                        placeholder="+1234567890&#10;+0987654321"
                        value={directPhones}
                        onChange={(e) => setDirectPhones(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Include country code (e.g., +1 for US)
                      </p>
                    </div>
                  )}

                  {/* Push: Device tokens */}
                  {selectedChannel === 'push' && (
                    <div className="space-y-2">
                      <Label htmlFor="direct-tokens" className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-4 w-4" />
                        Device Tokens
                      </Label>
                      <Textarea
                        id="direct-tokens"
                        placeholder="FCM or APNs device tokens..."
                        value={directDeviceTokens}
                        onChange={(e) => setDirectDeviceTokens(e.target.value)}
                        rows={3}
                        className="text-sm font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        FCM (Android) or APNs (iOS) tokens, comma or newline separated
                      </p>
                    </div>
                  )}

                  {/* User IDs: Available for all channels */}
                  <div className="space-y-2">
                    <Label htmlFor="direct-userids" className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4" />
                      User IDs
                    </Label>
                    <Textarea
                      id="direct-userids"
                      placeholder="user_123, user_456"
                      value={directUserIds}
                      onChange={(e) => setDirectUserIds(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedChannel === 'internal'
                        ? 'Target users by their external ID'
                        : 'Alternative to direct addresses - resolve from user profiles'}
                    </p>
                  </div>
                </div>

                {/* Hint for internal channel */}
                {selectedChannel === 'internal' && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    In-app notifications are delivered to users by their User ID. Make sure the IDs
                    match your registered contacts.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Template/Content Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Content</Label>
            </div>

            <RadioGroup
              value={templateMode}
              onValueChange={(v) => setTemplateMode(v as TemplateMode)}
              className="grid grid-cols-3 gap-3"
            >
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  templateMode === 'existing'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="existing" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Template</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  templateMode === 'code'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="code" />
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">By Code</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  templateMode === 'inline'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="inline" />
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Inline</span>
                </div>
              </label>
            </RadioGroup>

            {templateMode === 'existing' && (
              <div className="space-y-2">
                {templatesLoading ? (
                  <p className="text-sm text-muted-foreground py-2">Loading templates...</p>
                ) : filteredTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No templates found for {selectedChannel} channel.
                  </p>
                ) : (
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.map((template) => (
                        <SelectItem key={template.id ?? ''} value={template.id ?? ''}>
                          <div className="flex items-center gap-2">
                            <span>{template.code || template.id}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {templateMode === 'code' && (
              <div className="space-y-2">
                <Label htmlFor="template-code">Template Code</Label>
                <Input
                  id="template-code"
                  placeholder="e.g., welcome-email, order-confirmation"
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Reference a template by its unique code identifier
                </p>
              </div>
            )}

            {templateMode === 'inline' && (
              <div className="space-y-4">
                {/* Email: Subject field */}
                {selectedChannel === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="inline-subject">Subject</Label>
                    <Input
                      id="inline-subject"
                      placeholder="Email subject line..."
                      value={inlineSubject}
                      onChange={(e) => setInlineSubject(e.target.value)}
                    />
                  </div>
                )}

                {/* Push / Internal: Title field */}
                {(selectedChannel === 'push' || selectedChannel === 'internal') && (
                  <div className="space-y-2">
                    <Label htmlFor="inline-title">Title</Label>
                    <Input
                      id="inline-title"
                      placeholder={
                        selectedChannel === 'push'
                          ? 'Push notification title...'
                          : 'In-app notification title...'
                      }
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                    />
                  </div>
                )}

                {/* Body field - shown for all channels */}
                <div className="space-y-2">
                  <Label htmlFor="inline-body">
                    {selectedChannel === 'sms' ? 'Message *' : 'Body *'}
                  </Label>
                  <Textarea
                    id="inline-body"
                    placeholder={
                      selectedChannel === 'email'
                        ? 'Write your email content here...'
                        : selectedChannel === 'sms'
                          ? 'Write your SMS message here (160 chars recommended)...'
                          : selectedChannel === 'push'
                            ? 'Write your push notification message...'
                            : 'Write your in-app notification message...'
                    }
                    value={inlineBody}
                    onChange={(e) => setInlineBody(e.target.value)}
                    rows={selectedChannel === 'sms' ? 3 : 5}
                  />
                  {selectedChannel === 'sms' && (
                    <p className="text-xs text-muted-foreground">
                      {inlineBody.length} / 160 characters
                      {inlineBody.length > 160 && (
                        <span className="text-amber-600 ml-1">
                          (will be sent as {Math.ceil(inlineBody.length / 160)} segments)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Preview */}
                {inlineBody && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-muted-foreground font-medium">Preview</p>
                      <Badge variant="outline" className="text-xs">
                        {selectedChannel === 'email'
                          ? 'Email'
                          : selectedChannel === 'sms'
                            ? 'SMS'
                            : selectedChannel === 'push'
                              ? 'Push'
                              : 'In-App'}
                      </Badge>
                    </div>
                    {selectedChannel === 'email' && inlineSubject && (
                      <p className="text-sm font-semibold mb-1">Subject: {inlineSubject}</p>
                    )}
                    {(selectedChannel === 'push' || selectedChannel === 'internal') &&
                      inlineTitle && <p className="text-sm font-semibold mb-1">{inlineTitle}</p>}
                    <p className="text-sm whitespace-pre-wrap">{inlineBody}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Options</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as NotificationPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="not-before" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule (Not Before)
                </Label>
                <Input
                  id="not-before"
                  type="datetime-local"
                  value={notBefore}
                  onChange={(e) => setNotBefore(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correlation-id" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Correlation ID
                </Label>
                <Input
                  id="correlation-id"
                  placeholder="Optional tracking identifier"
                  value={correlationId}
                  onChange={(e) => setCorrelationId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Data / Metadata
                </Label>
                <Textarea
                  id="metadata"
                  placeholder='{"orderId": "123", "userId": "456"}'
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  rows={2}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  JSON key-value pairs for template variables
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={sendNotification} disabled={sending} className="gap-2">
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

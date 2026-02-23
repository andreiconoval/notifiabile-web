'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateResponse, NotificationChannelType } from '@/api/generated/schemas';
import { AppWindow, MessageSquare, Smartphone } from 'lucide-react';

function EmailPreview({ template }: { template: TemplateResponse }) {
  const content = template.content;
  return (
    <div className="space-y-4">
      {content?.emailSubject && (
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground mb-1">Subject</p>
          <p className="font-medium">{content.emailSubject}</p>
        </div>
      )}
      {content?.emailHtml ? (
        <Tabs defaultValue="visual">
          <TabsList className="mb-2">
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="html">HTML Source</TabsTrigger>
            {content.emailText && <TabsTrigger value="text">Plain Text</TabsTrigger>}
          </TabsList>
          <TabsContent value="visual">
            <div className="rounded-md border bg-white">
              <iframe
                srcDoc={content.emailHtml}
                title="Email preview"
                className="w-full min-h-[400px] border-0 rounded-md"
                sandbox=""
              />
            </div>
          </TabsContent>
          <TabsContent value="html">
            <pre className="rounded-md border bg-muted p-4 text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
              {content.emailHtml}
            </pre>
          </TabsContent>
          {content.emailText && (
            <TabsContent value="text">
              <pre className="rounded-md border bg-muted p-4 text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
                {content.emailText}
              </pre>
            </TabsContent>
          )}
        </Tabs>
      ) : content?.emailText ? (
        <div className="rounded-md border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-2">Plain Text</p>
          <pre className="text-sm whitespace-pre-wrap">{content.emailText}</pre>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          No email content defined for this template.
        </p>
      )}
    </div>
  );
}

function SmsPreview({ template }: { template: TemplateResponse }) {
  const content = template.content;
  return content?.smsText ? (
    <div className="flex justify-center py-4">
      <div className="w-[320px] rounded-2xl border-2 border-gray-300 bg-gray-50 p-4">
        <div className="mb-3 flex items-center gap-2 border-b pb-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">SMS Message</span>
        </div>
        <div className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm text-white">
          {content.smsText}
        </div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground text-center py-8">
      No SMS content defined for this template.
    </p>
  );
}

function PushPreview({ template }: { template: TemplateResponse }) {
  const content = template.content;
  return content?.pushTitle || content?.pushBody ? (
    <div className="flex justify-center py-4">
      <div className="w-[360px] rounded-xl border bg-white shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-indigo-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">App Name</p>
            {content.pushTitle && (
              <p className="font-semibold text-sm mt-0.5">{content.pushTitle}</p>
            )}
            {content.pushBody && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{content.pushBody}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">now</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground text-center py-8">
      No push content defined for this template.
    </p>
  );
}

function InternalPreview({ template }: { template: TemplateResponse }) {
  const content = template.content;
  return content?.internalTitle || content?.internalBody ? (
    <div className="flex justify-center py-4">
      <div className="w-[360px] rounded-xl border bg-white shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AppWindow className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Internal Notification
            </p>
            {content.internalTitle && (
              <p className="font-semibold text-sm mt-0.5">{content.internalTitle}</p>
            )}
            {content.internalBody && (
              <p className="text-sm text-muted-foreground mt-1">{content.internalBody}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground text-center py-8">
      No internal content defined for this template.
    </p>
  );
}

export default function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: {
  template: TemplateResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const channelLabel: Record<NotificationChannelType, string> = {
    email: 'Email',
    push: 'Push Notification',
    sms: 'SMS',
    internal: 'Internal',
  };

  const isExternal = template.isExternal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Preview: {template.code}</DialogTitle>
            <Badge variant="outline">{channelLabel[template.channelType ?? 'email']}</Badge>
            {template.status && (
              <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                {template.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isExternal ? (
          <div className="rounded-md border bg-muted p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              This template uses an external provider.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              {template.externalProvider && (
                <span>
                  <span className="text-muted-foreground">Provider:</span>{' '}
                  <strong>{template.externalProvider}</strong>
                </span>
              )}
              {template.externalTemplateId && (
                <span>
                  <span className="text-muted-foreground">Template ID:</span>{' '}
                  <strong>{template.externalTemplateId}</strong>
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            {template.channelType === 'email' && <EmailPreview template={template} />}
            {template.channelType === 'sms' && <SmsPreview template={template} />}
            {template.channelType === 'push' && <PushPreview template={template} />}
            {template.channelType === 'internal' && <InternalPreview template={template} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Mail, MessageSquare, Smartphone, AppWindow } from 'lucide-react';
import { TemplateResponse, NotificationChannelType } from '@/api/generated/schemas';
import UpdateTemplateDialog from './update-template-dialog';
import TemplatePreviewDialog from './template-preview-dialog';

export default function TemplateCard({ template }: { template: TemplateResponse }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const channelIcons: Record<NotificationChannelType, any> = {
    email: Mail,
    push: Smartphone,
    sms: MessageSquare,
    internal: AppWindow,
  };
  const Icon = channelIcons[template.channelType ?? 'email'];

  return (
    <Card key={template.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-indigo-700" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{template.code}</CardTitle>
              <CardDescription className="mt-1 capitalize">
                {template.channelType} • v1
              </CardDescription>
            </div>
          </div>
          <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
            {template.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            {template.content?.emailSubject && (
              <p className="mb-2">
                <span className="text-gray-500">Subject:</span> {template.content.emailSubject}
              </p>
            )}
            {template.content?.pushTitle && (
              <p className="mb-2">
                <span className="text-gray-500">Title:</span> {template.content.pushTitle}
              </p>
            )}
            {template.content?.internalTitle && (
              <p className="mb-2">
                <span className="text-gray-500">Title:</span> {template.content.internalTitle}
              </p>
            )}
            <p className="text-gray-600 line-clamp-2 font-mono text-xs">
              {template.content?.emailHtml ||
                template.content?.pushBody ||
                template.content?.smsText ||
                template.content?.internalBody ||
                ''}
            </p>
          </div>
          {/* {template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.variables.map((v) => (
                  <Badge key={v} variant="outline" className="text-xs">
                    {v}
                  </Badge>
                ))}
              </div>
            )} */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <UpdateTemplateDialog template={template}>
              <Button size="sm" variant="outline" className="flex-1">
                Edit
              </Button>
            </UpdateTemplateDialog>
          </div>
          <TemplatePreviewDialog
            template={template}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
          />
        </div>
      </CardContent>
    </Card>
  );
}

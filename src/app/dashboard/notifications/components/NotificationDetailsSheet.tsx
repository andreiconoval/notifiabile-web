'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Smartphone,
  User,
  XCircle,
} from 'lucide-react';
import type { NotificationDetailResponse, NotificationListItem } from '../types';
import type { NotificationStatus } from '@/api/generated/schemas';

interface NotificationDetailsSheetProps {
  notification: NotificationListItem | null;
  detailData: NotificationDetailResponse | null;
  loading: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  NotificationStatus,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  queued: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <Clock className="h-3.5 w-3.5" />,
    label: 'Queued',
  },
  processing: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
    label: 'Processing',
  },
  sent: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Sent',
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'Failed',
  },
  partiallyDelivered: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Partial',
  },
};

const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  email: { icon: <Mail className="h-4 w-4" />, label: 'Email' },
  sms: { icon: <Phone className="h-4 w-4" />, label: 'SMS' },
  push: { icon: <Smartphone className="h-4 w-4" />, label: 'Push' },
  internal: { icon: <MessageSquare className="h-4 w-4" />, label: 'In-App' },
};

export default function NotificationDetailsSheet({
  notification,
  detailData,
  loading,
  onClose,
}: NotificationDetailsSheetProps) {
  const statusConfig = notification?.status ? STATUS_CONFIG[notification.status] : null;
  const channelConfig = notification?.channel ? CHANNEL_CONFIG[notification.channel] : null;

  return (
    <Sheet
      open={!!notification}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">Notification Details</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-xs">
                <Hash className="h-3 w-3" />
                {notification?.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {notification && (
          <div className="px-6 mt-6 space-y-6">
            {/* Status & Channel Badges */}
            <div className="flex items-center gap-3">
              {statusConfig && (
                <Badge
                  variant="secondary"
                  className={`gap-1.5 ${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              )}
              {channelConfig && (
                <Badge variant="outline" className="gap-1.5">
                  {channelConfig.icon}
                  {channelConfig.label}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Title"
                  value={notification.title || '—'}
                />
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="Recipient"
                  value={notification.recipient || '—'}
                  mono
                />
                <DetailItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created"
                  value={
                    notification.created ? new Date(notification.created).toLocaleString() : '—'
                  }
                />
                <DetailItem
                  icon={<RefreshCw className="h-4 w-4" />}
                  label="Attempts"
                  value={String(notification.attempts)}
                />
              </div>

              {notification.latency !== undefined && (
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Latency"
                  value={`${notification.latency}ms`}
                />
              )}
            </div>

            <Separator />

            {/* Message Body */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Message Content
              </h3>
              <div className="rounded-lg border bg-muted/30 p-4">
                {notification.body ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{notification.body}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No message body available</p>
                )}
              </div>
            </div>

            {/* API Response */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Raw Data
              </h3>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-lg border bg-muted/30">
                  <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  Loading details...
                </div>
              ) : detailData || notification.raw ? (
                <div className="rounded-lg border bg-muted/30 p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-muted-foreground">
                    {JSON.stringify(detailData || notification.raw, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-4 rounded-lg border bg-muted/30">
                  No additional details available.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailItem({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={`text-sm ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
    </div>
  );
}

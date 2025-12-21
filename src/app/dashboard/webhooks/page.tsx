'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Webhook as WebhookIcon, Copy, Eye, RefreshCw } from 'lucide-react';
import type { Webhook } from '../../../utils/types';
import { toast } from 'sonner';

const WEBHOOK_EVENTS = [
  'notification.created',
  'notification.delivered',
  'notification.failed',
  'notification.bounced',
  'notification.complaint',
  'notification.opened',
  'notification.clicked',
];

export default function WebhooksPage() {
  const { selectedOrg } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'notification.delivered',
    'notification.failed',
  ]);

  useEffect(() => {
    loadWebhooks();
  }, [selectedOrg]);

  async function loadWebhooks() {
    if (!selectedOrg) return;

    setLoading(true);
    try {
      const result = await api.getWebhooks(selectedOrg.id);
      setWebhooks(result.webhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedOrg) return;

    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    const description = formData.get('description') as string;

    try {
      await api.createWebhook({
        orgId: selectedOrg.id,
        url,
        description,
        events: selectedEvents,
      });
      toast.success('Webhook created successfully');
      setCreateDialogOpen(false);
      setSelectedEvents(['notification.delivered', 'notification.failed']);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    toast.success('Signing secret copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Webhooks</h1>
          <p className="text-gray-600">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
              <DialogDescription>
                Receive real-time notifications about events in your account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createWebhook}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://your-app.com/webhooks/notifiable"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Production webhook endpoint"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Events to subscribe</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Checkbox
                          id={event}
                          checked={selectedEvents.includes(event)}
                          onCheckedChange={(checked: any) => {
                            if (checked) {
                              setSelectedEvents([...selectedEvents, event]);
                            } else {
                              setSelectedEvents(selectedEvents.filter((e) => e !== event));
                            }
                          }}
                        />
                        <label htmlFor={event} className="text-sm cursor-pointer">
                          {event}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Webhook</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Manage your webhook endpoints and their subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <WebhookIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No webhooks configured</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add a webhook endpoint to receive event notifications
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{webhook.url}</p>
                        {webhook.description && (
                          <p className="text-xs text-gray-500 mt-1">{webhook.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                        {webhook.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(webhook.created).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copySecret(webhook.secret)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Example payload */}
      <Card>
        <CardHeader>
          <CardTitle>Example Webhook Payload</CardTitle>
          <CardDescription>Sample payload structure for webhook events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>
              {JSON.stringify(
                {
                  event: 'notification.delivered',
                  timestamp: '2024-11-11T10:30:00Z',
                  data: {
                    notificationId: 'ntf_abc123',
                    channel: 'email',
                    recipient: 'user@example.com',
                    template: 'welcome-email',
                    deliveredAt: '2024-11-11T10:30:05Z',
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Signing secrets info */}
      <Card>
        <CardHeader>
          <CardTitle>Verifying Webhook Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Each webhook request includes a signature in the{' '}
            <code className="bg-gray-100 px-1 rounded">X-Notifiable-Signature</code> header. Use
            your signing secret to verify the authenticity of webhook requests.
          </p>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

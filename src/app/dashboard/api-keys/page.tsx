'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListApiKeysEndpoint,
  useCreateApiKeyEndpoint,
  useRevokeApiKeyEndpoint,
  getListApiKeysEndpointQueryKey,
} from '@/api/generated/notifiable.web';
import type { ApiKeyResponse, CreateApiKeyResponse } from '@/api/generated/schemas';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Key, Copy } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_SCOPES = [
  { value: 'notifications:send', label: 'Send Notifications', description: 'Send notifications via any channel' },
  { value: 'audience:read', label: 'Read Audience', description: 'List and view contacts and audiences' },
  { value: 'audience:write', label: 'Write Audience', description: 'Create, update, and delete contacts and audiences' },
  { value: 'internal-notifications:read', label: 'Read Internal Notifications', description: 'List and consume in-app notifications' },
] as const;

const SCOPE_SHORT_LABELS: Record<string, string> = {
  'notifications:send': 'Send',
  'audience:read': 'Audience R',
  'audience:write': 'Audience W',
  'internal-notifications:read': 'Internal R',
};

function getStatusBadge(key: ApiKeyResponse) {
  if (key.isActive) {
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  }
  if (key.revokedAt) {
    return <Badge variant="destructive">Revoked</Badge>;
  }
  return <Badge variant="secondary">Expired</Badge>;
}

export default function APIKeysPage() {
  const { selectedOrg } = useAuth();
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useListApiKeysEndpoint();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<CreateApiKeyResponse | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['notifications:send']);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyResponse | null>(null);

  const createMutation = useCreateApiKeyEndpoint({
    mutation: {
      onSuccess: (data) => {
        setNewKey(data);
        queryClient.invalidateQueries({ queryKey: getListApiKeysEndpointQueryKey() });
        toast.success('API key created');
      },
      onError: () => {
        toast.error('Failed to create API key');
      },
    },
  });

  const revokeMutation = useRevokeApiKeyEndpoint({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysEndpointQueryKey() });
        toast.success('API key revoked');
        setRevokeTarget(null);
      },
      onError: () => {
        toast.error('Failed to revoke API key');
      },
    },
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    createMutation.mutate({
      data: {
        name,
        scopes: selectedScopes,
        organizationId: selectedOrg?.id,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
    });
  }

  function resetCreateDialog() {
    setNewKey(null);
    setSelectedScopes(['notifications:send']);
    setHasExpiration(false);
    setExpiresAt(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">API Keys & Access</h1>
          <p className="text-gray-600">Manage API keys for programmatic access</p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetCreateDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{newKey ? 'API Key Created' : 'Create API Key'}</DialogTitle>
              <DialogDescription>
                {newKey
                  ? "Copy your API key now. It won't be shown again."
                  : 'Generate a new API key for accessing the Notifiable API'}
              </DialogDescription>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border break-all">
                      {newKey.rawKey}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKey.rawKey ?? '')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-900">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Key Name</Label>
                    <Input id="name" name="name" placeholder="Production API Key" required />
                  </div>

                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="space-y-2">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <label key={scope.value} className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedScopes.includes(scope.value)}
                            onCheckedChange={(checked) => {
                              setSelectedScopes((prev) =>
                                checked
                                  ? [...prev, scope.value]
                                  : prev.filter((s) => s !== scope.value)
                              );
                            }}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium">{scope.label}</span>
                            <p className="text-xs text-gray-500">{scope.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={hasExpiration}
                        onCheckedChange={(checked) => {
                          setHasExpiration(!!checked);
                          if (!checked) setExpiresAt(null);
                        }}
                      />
                      <span className="text-sm font-medium">Set expiration date</span>
                    </label>
                    {hasExpiration && (
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={expiresAt ?? ''}
                        onChange={(e) => setExpiresAt(e.target.value || null)}
                        required
                      />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={selectedScopes.length === 0 || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Key'}
                  </Button>
                </DialogFooter>
              </form>
            )}
            {newKey && (
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetCreateDialog();
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            These keys allow programmatic access to the Notifiable API
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !keys || keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No API keys yet</h3>
              <p className="text-sm text-gray-600 mb-4">Create your first API key to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">{key.keyPrefix}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {SCOPE_SHORT_LABELS[scope] ?? scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(key)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.keyPrefix ?? '')}
                          title="Copy key prefix"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!key.isActive}
                          onClick={() => setRevokeTarget(key)}
                        >
                          Revoke
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

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke &quot;{revokeTarget?.name}&quot;?
              This action cannot be undone. Any services using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (revokeTarget?.id) {
                  revokeMutation.mutate({
                    id: revokeTarget.id,
                    data: { organizationId: selectedOrg?.id },
                  });
                }
              }}
              disabled={revokeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Using the API</CardTitle>
          <CardDescription>Quick start guide for integrating with Notifiable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm mb-2">Send a notification</h4>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`curl -X POST https://api.notifiable.io/api/notifications \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelType": "Internal",
    "recipients": { "userIds": ["..."] },
    "content": { "title": "Hello", "body": "World" }
  }'`}</pre>
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-2">Check notification status</h4>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`curl https://api.notifiable.io/api/notifications/:id \\
  -H "X-Api-Key: YOUR_API_KEY"`}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

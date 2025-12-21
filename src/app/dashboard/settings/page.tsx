'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../../contexts/AuthContext';
import { Settings as SettingsIcon, Users, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { selectedOrg } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage organization settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="domain">Domain Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" defaultValue={selectedOrg?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="UTC">
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suppression Lists</CardTitle>
              <CardDescription>Manage unsubscribes and blocked recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm">Unsubscribed</p>
                    <p className="text-xs text-gray-500">423 recipients</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm">Bounced</p>
                    <p className="text-xs text-gray-500">87 recipients</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage team access and permissions</CardDescription>
                </div>
                <Button>Invite Member</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">No team members yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security</p>
                </div>
                <Button size="sm" variant="outline">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">IP Allowlist</p>
                  <p className="text-xs text-gray-500">Restrict access by IP address</p>
                </div>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Verification</CardTitle>
              <CardDescription>
                Set up SPF, DKIM, and DMARC records for email sending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Verify your domain to improve email deliverability and enable advanced features
                  </p>
                </div>
                <Button>Start Domain Setup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

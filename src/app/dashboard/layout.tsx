'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Bell,
  Megaphone,
  FileText,
  Users,
  Plug,
  Webhook,
  Key,
  BarChart3,
  Activity,
  Settings,
  FileSearch,
  Menu,
  LogOut,
  ChevronDown,
  User2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Environment } from '../../utils/types';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const { user, organizations, selectedOrg, selectedEnv, signOut, selectOrg, setEnvironment } =
    useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const [hasSeededData, setHasSeededData] = useState(false);

  useEffect(() => {
    // Check if we need to seed data
    const seeded = localStorage.getItem('notifiable-seeded');
    if (seeded) {
      setHasSeededData(true);
    }
  }, []);

  const navigation = [
    { id: '/dashboard/overview', name: 'Overview', icon: LayoutDashboard },
    { id: '/dashboard/notifications', name: 'Notifications', icon: Bell },
    { id: '/dashboard/campaigns', name: 'Campaigns', icon: Megaphone },
    { id: '/dashboard/templates', name: 'Templates', icon: FileText },
    { id: '/dashboard/audiences', name: 'Audiences', icon: Users },
    { id: '/dashboard/recipients', name: 'Recipients', icon: User2 },
    { id: '/dashboard/providers', name: 'Channels & Providers', icon: Plug },
    { id: '/dashboard/webhooks', name: 'Webhooks', icon: Webhook },
    { id: '/dashboard/api-keys', name: 'API Keys', icon: Key },
    { id: '/dashboard/reporting', name: 'Reporting', icon: BarChart3 },
    { id: '/dashboard/health', name: 'Health', icon: Activity },
    { id: '/dashboard/settings', name: 'Settings', icon: Settings },
    { id: '/dashboard/audit', name: 'Audit Log', icon: FileSearch },
  ];

  const envColors: Record<Environment, string> = {
    production: 'bg-green-500',
    staging: 'bg-yellow-500',
    dev: 'bg-blue-500',
  };

  async function seedDemoData() {
    if (!selectedOrg) return;

    try {
      await api.seedData(selectedOrg.id);
      localStorage.setItem('notifiable-seeded', 'true');
      setHasSeededData(true);
      toast.success('Demo data created! Navigate to Notifications to see sample data.');
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast.error('Failed to create demo data');
    }
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl text-gray-900">Notifiable</h1>
            <p className="text-xs text-gray-500">Notifications API</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                router.push(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm text-indigo-700">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!hasSeededData && selectedOrg && (
        <Card className="mb-6 border-indigo-200 bg-indigo-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  👋 Welcome to Notifiable! Generate sample notification data to explore the
                  dashboard.
                </p>
              </div>
              <Button onClick={seedDemoData} size="sm">
                Generate Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-white">
          <NavContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex items-center gap-3">
              {/* Organization Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-between">
                    <span className="truncate">{selectedOrg?.name || 'Select org'}</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => selectOrg(org)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{org.name}</span>
                      {selectedOrg?.id === org.id && (
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Environment Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <div className={`h-2 w-2 rounded-full ${envColors[selectedEnv]}`} />
                    <span className="capitalize">{selectedEnv}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Environment</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(['production', 'staging', 'dev'] as Environment[]).map((env) => (
                    <DropdownMenuItem
                      key={env}
                      onClick={() => setEnvironment(env)}
                      className="flex items-center gap-2"
                    >
                      <div className={`h-2 w-2 rounded-full ${envColors[env]}`} />
                      <span className="capitalize">{env}</span>
                      {selectedEnv === env && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {user?.role}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm text-indigo-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
}

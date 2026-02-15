import { NotificationStatus } from '@/api/generated/schemas';

export type UserRole = 'PlatformAdmin' | 'OrgOwner' | 'OrgManager' | 'OrgViewer' | 'SupportAgent';

export type Environment = 'production' | 'staging' | 'dev';

export type Channel = 'email' | 'push' | 'sms' | 'web_push';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

export type TemplateStatus = 'draft' | 'published' | 'archived';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  role: UserRole;
  timezone: string;
  created: string;
}

export interface Notification {
  id: string;
  orgId: string;
  channel: Channel;
  status: NotificationStatus;
  template: string;
  recipient: string;
  created: string;
  sent?: string;
  attempts: number;
  latency?: number;
  campaignId?: string;
  metadata?: Record<string, any>;
  payload?: any;
  providerResponse?: any;
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  templateId: string;
  audienceId: string;
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring';
    startAt?: string;
    endAt?: string;
    cron?: string;
  };
  status: CampaignStatus;
  created: string;
  createdBy: string;
  analytics?: {
    sent: number;
    delivered: number;
    failed: number;
    opened?: number;
    clicked?: number;
  };
}

export interface Template {
  id: string;
  orgId: string;
  name: string;
  channel: Channel;
  content: {
    subject?: string;
    body: string;
    preheader?: string;
  };
  variables: string[];
  version: number;
  status: TemplateStatus;
  created: string;
  updated: string;
  createdBy: string;
  tags?: string[];
}

export interface Audience {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  rules?: any;
  count?: number;
  created: string;
  updated: string;
}

export interface Provider {
  id: string;
  orgId: string;
  name: string;
  type: Channel;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  health?: {
    lastCheck: string;
    uptime: number;
    errorRate: number;
  };
  rateLimit?: {
    limit: number;
    window: string;
  };
}

export interface Webhook {
  id: string;
  orgId: string;
  url: string;
  events: string[];
  description?: string;
  secret: string;
  status: 'active' | 'inactive';
  created: string;
  createdBy: string;
}

export interface AuditLog {
  userId: string;
  orgId: string;
  action: string;
  resource: string;
  details: any;
  timestamp: string;
}

export interface AnalyticsOverview {
  kpis: {
    totalSent: number;
    successRate: number;
    avgLatency: number;
    activeIncidents: number;
  };
  volumeChart: Array<{
    date: string;
    delivered: number;
    failed: number;
    pending: number;
  }>;
  byChannel: Record<string, number>;
}

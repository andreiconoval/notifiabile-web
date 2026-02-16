import { projectId } from './supabase/info';
import type {
  Organization,
  Notification,
  Campaign,
  Template,
  Webhook,
  AuditLog,
  AnalyticsOverview,
  Environment,
} from './types';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6ccce88d`;

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('API client has no auth token. Call setToken() before making requests.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`API Error (${endpoint}):`, error);
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request<{ user: any; org: Organization }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getUserOrgs() {
    return this.request<{ orgs: Organization[] }>('/auth/orgs');
  }

  // Notifications
  async getNotifications(
    orgId: string,
    env: Environment,
    filters?: {
      status?: string;
      channel?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams({
      orgId,
      env,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.channel && { channel: filters.channel }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.offset && { offset: filters.offset.toString() }),
    });
    return this.request<{
      notifications: Notification[];
      total: number;
      limit: number;
      offset: number;
    }>(`/notifications?${params}`);
  }

  async getNotification(id: string, orgId: string, env: Environment) {
    return this.request<Notification>(`/notifications/${id}?orgId=${orgId}&env=${env}`);
  }

  // Campaigns
  async getCampaigns(orgId: string, env: Environment) {
    return this.request<{ campaigns: Campaign[] }>(`/campaigns?orgId=${orgId}&env=${env}`);
  }

  async createCampaign(data: {
    orgId: string;
    env: Environment;
    name: string;
    templateId: string;
    audienceId: string;
    schedule?: any;
  }) {
    return this.request<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Templates
  async getTemplates(orgId: string, env: Environment) {
    return this.request<{ templates: Template[] }>(`/templates?orgId=${orgId}&env=${env}`);
  }

  async createTemplate(data: {
    orgId: string;
    env: Environment;
    name: string;
    channel: string;
    content: any;
    variables?: string[];
  }) {
    return this.request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Webhooks
  async getWebhooks(orgId: string) {
    return this.request<{ webhooks: Webhook[] }>(`/webhooks?orgId=${orgId}`);
  }

  async createWebhook(data: {
    orgId: string;
    url: string;
    events: string[];
    description?: string;
  }) {
    return this.request<Webhook>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalyticsOverview(orgId: string, env: Environment) {
    return this.request<AnalyticsOverview>(`/analytics/overview?orgId=${orgId}&env=${env}`);
  }

  // Audit Log
  async getAuditLog(orgId: string) {
    return this.request<{ logs: AuditLog[] }>(`/audit-log?orgId=${orgId}`);
  }

  // Audiences
  async getAudiences(orgId: string) {
    return this.request<{ audiences: any[] }>(`/audiences?orgId=${orgId}`);
  }

  async createAudience(data: {
    orgId: string;
    name: string;
    description?: string;
    type?: 'static' | 'dynamic';
    rules?: any;
  }) {
    return this.request('/audiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Providers
  async getProviders(orgId: string) {
    return this.request<{ providers: any[] }>(`/providers?orgId=${orgId}`);
  }

  async createProvider(data: { orgId: string; name: string; type: string; config: any }) {
    return this.request('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Seed data (for development)
  async seedData(orgId: string) {
    return this.request('/seed', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    });
  }
}

export const api = new ApiClient();

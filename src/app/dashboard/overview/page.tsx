'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalyticsOverview } from '../../../utils/types';
import { Badge } from '@/components/ui/badge';

export default function OverviewPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedOrg, selectedEnv]);

  async function loadData() {
    if (!selectedOrg) return;

    setLoading(true);
    try {
      const result = await api.getAnalyticsOverview(selectedOrg.id, selectedEnv);
      setData(result);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load data</div>;
  }

  const { kpis, volumeChart, byChannel } = data;

  const channelData = Object.entries(byChannel).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Overview</h1>
        <p className="text-gray-600">
          Real-time metrics and insights for {selectedOrg?.name} ({selectedEnv})
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Sent</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.totalSent.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.successRate >= 95 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> Excellent
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" /> Needs attention
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.avgLatency}ms</div>
            <p className="text-xs text-gray-500 mt-1">P50 response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Incidents</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${kpis.activeIncidents > 0 ? 'text-red-600' : 'text-gray-500'}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.activeIncidents}</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.activeIncidents === 0 ? (
                <span className="text-green-600">All systems operational</span>
              ) : (
                <span className="text-red-600">Requires attention</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Send Volume</CardTitle>
            <CardDescription>Notification volume by status over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Channel</CardTitle>
            <CardDescription>Breakdown of notifications by channel type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Health</CardTitle>
          <CardDescription>Status of notification providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Mailjet (Email)', 'FCM (Push)', 'Twilio (SMS)', 'OneSignal (Web Push)'].map(
              (provider, i) => (
                <div
                  key={provider}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                    <span className="text-sm">{provider}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Uptime: 99.9%</span>
                    <Badge variant={i < 3 ? 'default' : 'secondary'}>
                      {i < 3 ? 'Operational' : 'Degraded'}
                    </Badge>
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

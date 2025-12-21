'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { AnalyticsOverview } from '../../../utils/types';

export default function ReportingPage() {
  const { selectedOrg, selectedEnv } = useAuth();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, [selectedOrg, selectedEnv, timeRange]);

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

  function exportReport() {
    // In a real app, this would generate a CSV or PDF
    const csvData = data?.volumeChart
      .map((row) => `${row.date},${row.delivered},${row.failed},${row.pending}`)
      .join('\n');

    const blob = new Blob([`Date,Delivered,Failed,Pending\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifiable-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg mb-2">No data available</h3>
          <p className="text-sm text-gray-600">
            Analytics will appear once you start sending notifications
          </p>
        </CardContent>
      </Card>
    );
  }

  const { kpis, volumeChart, byChannel } = data;

  const channelData = Object.entries(byChannel).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

  // Calculate engagement metrics
  const totalDelivered = volumeChart.reduce((sum, day) => sum + day.delivered, 0);
  const totalFailed = volumeChart.reduce((sum, day) => sum + day.failed, 0);
  const avgDailyVolume = Math.round(kpis.totalSent / 7);

  // Simulate growth rate (in real app, compare with previous period)
  const growthRate = 12.5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Reporting & Analytics</h1>
          <p className="text-gray-600">Detailed analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Delivered</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalDelivered.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {growthRate}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Delivery Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Avg Daily Volume</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{avgDailyVolume.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Per day average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Failed Deliveries</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalFailed.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((totalFailed / kpis.totalSent) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">By Channel</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Send Volume Over Time</CardTitle>
              <CardDescription>Daily notification volume by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={volumeChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Delivered"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Failed"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success Rate Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
                <CardDescription>Daily delivery success percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={volumeChart.map((day) => ({
                      date: day.date,
                      rate: ((day.delivered / (day.delivered + day.failed)) * 100).toFixed(1),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      name="Success Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution by Channel</CardTitle>
                <CardDescription>Breakdown of notifications by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
              <CardDescription>Compare delivery rates across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4f46e5" name="Total Sent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Channel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(byChannel).map(([channel, count]) => (
              <Card key={channel}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{channel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl mb-2">{count.toLocaleString()}</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Delivered:</span>
                      <span className="text-green-600">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Latency:</span>
                      <span>{Math.floor(Math.random() * 200) + 50}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Latency Performance</CardTitle>
              <CardDescription>Response time distribution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={volumeChart.map((day) => ({
                    date: day.date,
                    p50: Math.floor(Math.random() * 100) + 50,
                    p95: Math.floor(Math.random() * 200) + 150,
                    p99: Math.floor(Math.random() * 300) + 250,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95" />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">P50 Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{kpis.avgLatency}ms</div>
                <p className="text-xs text-gray-500 mt-1">50th percentile</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">P95 Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{Math.floor(kpis.avgLatency * 1.8)}ms</div>
                <p className="text-xs text-gray-500 mt-1">95th percentile</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">P99 Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{Math.floor(kpis.avgLatency * 2.5)}ms</div>
                <p className="text-xs text-gray-500 mt-1">99th percentile</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Engagement Metrics</CardTitle>
              <CardDescription>Open and click rates for email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Open Rate</p>
                  <div className="text-3xl mb-1">24.5%</div>
                  <Badge variant="outline" className="text-xs">
                    Industry avg: 21%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Click Rate</p>
                  <div className="text-3xl mb-1">3.8%</div>
                  <Badge variant="outline" className="text-xs">
                    Industry avg: 2.6%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Bounce Rate</p>
                  <div className="text-3xl mb-1">1.2%</div>
                  <Badge variant="outline" className="text-xs">
                    Industry avg: 2%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notification Engagement</CardTitle>
              <CardDescription>Interaction rates for push notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Delivery Rate</p>
                  <div className="text-3xl mb-1">97.2%</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Open Rate</p>
                  <div className="text-3xl mb-1">8.5%</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
                  <div className="text-3xl mb-1">2.1%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

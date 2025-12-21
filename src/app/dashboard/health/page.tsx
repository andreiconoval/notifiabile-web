'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, Server } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HealthMetrics {
  queueDepth: number;
  retryRate: number;
  errorBudget: number;
  avgProcessingTime: number;
  activeWorkers: number;
  providers: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    uptime: number;
    lastCheck: string;
  }>;
}

export default function HealthPage() {
  const { selectedOrg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetrics>({
    queueDepth: 1234,
    retryRate: 2.3,
    errorBudget: 98.7,
    avgProcessingTime: 145,
    activeWorkers: 8,
    providers: [
      {
        name: 'Email Providers',
        status: 'operational',
        uptime: 99.98,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Push Notification Services',
        status: 'operational',
        uptime: 99.95,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'SMS Gateways',
        status: 'operational',
        uptime: 99.91,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Web Push Services',
        status: 'degraded',
        uptime: 97.45,
        lastCheck: new Date().toISOString(),
      },
    ],
  });

  // Simulate real-time data
  const [queueHistory, setQueueHistory] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: `${i}m`,
      depth: Math.floor(Math.random() * 2000) + 500,
    })),
  );

  useEffect(() => {
    setLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setQueueHistory((prev) => {
        const newData = [
          ...prev.slice(1),
          {
            time: `${prev.length}m`,
            depth: Math.floor(Math.random() * 2000) + 500,
          },
        ];
        return newData;
      });

      // Update metrics slightly
      setMetrics((prev) => ({
        ...prev,
        queueDepth: Math.floor(Math.random() * 2000) + 500,
        retryRate: +(Math.random() * 5).toFixed(1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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

  const overallHealth = metrics.providers.every((p) => p.status === 'operational')
    ? 'healthy'
    : metrics.providers.some((p) => p.status === 'down')
      ? 'critical'
      : 'degraded';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">System Health & Monitoring</h1>
          <p className="text-gray-600">Real-time system health and delivery performance</p>
        </div>
        <Badge
          variant={
            overallHealth === 'healthy'
              ? 'default'
              : overallHealth === 'critical'
                ? 'destructive'
                : 'secondary'
          }
          className="text-sm px-4 py-1"
        >
          {overallHealth === 'healthy' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" /> All Systems Operational
            </>
          ) : overallHealth === 'critical' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-1" /> Critical Issues
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-1" /> Degraded Performance
            </>
          )}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Queue Depth</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.queueDepth.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Messages in queue</p>
            <Progress value={Math.min((metrics.queueDepth / 5000) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Retry Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.retryRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            <Badge
              variant={metrics.retryRate < 5 ? 'outline' : 'secondary'}
              className="mt-2 text-xs"
            >
              {metrics.retryRate < 5 ? 'Normal' : 'Elevated'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Error Budget</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.errorBudget}%</div>
            <p className="text-xs text-green-600 mt-1">Within target</p>
            <Progress value={metrics.errorBudget} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.avgProcessingTime}ms</div>
            <p className="text-xs text-gray-500 mt-1">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Depth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Depth Over Time</CardTitle>
          <CardDescription>Real-time queue depth monitoring (last 20 minutes)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={queueHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="depth" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Provider Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Health Status</CardTitle>
          <CardDescription>Real-time status of delivery providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.providers.map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      provider.status === 'operational'
                        ? 'bg-green-500 animate-pulse'
                        : provider.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{provider.name}</p>
                    <p className="text-xs text-gray-500">
                      Last checked: {new Date(provider.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Uptime</p>
                    <p className="text-sm">{provider.uptime}%</p>
                  </div>
                  <Badge
                    variant={
                      provider.status === 'operational'
                        ? 'default'
                        : provider.status === 'degraded'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {provider.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Worker Pool</CardTitle>
            <CardDescription>Active notification processing workers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Workers</span>
                <span className="text-2xl">{metrics.activeWorkers}/12</span>
              </div>
              <Progress value={(metrics.activeWorkers / 12) * 100} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Throughput</p>
                  <p className="text-sm">1,250/min</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Server className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">CPU Usage</p>
                  <p className="text-sm">42%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Circuit Breakers</CardTitle>
            <CardDescription>Provider failover protection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Email Primary', 'Email Fallback', 'SMS Primary', 'Push Primary'].map(
                (circuit, i) => (
                  <div
                    key={circuit}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      />
                      <span className="text-sm">{circuit}</span>
                    </div>
                    <Badge variant={i === 1 ? 'secondary' : 'outline'}>
                      {i === 1 ? 'Half-Open' : 'Closed'}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance</CardTitle>
          <CardDescription>Service level agreement tracking for the current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Availability SLA</p>
              <div className="text-3xl mb-1">{metrics.errorBudget}%</div>
              <Progress value={metrics.errorBudget} className="mb-2" />
              <p className="text-xs text-green-600">Target: 99.9%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Latency SLA</p>
              <div className="text-3xl mb-1">99.2%</div>
              <Progress value={99.2} className="mb-2" />
              <p className="text-xs text-green-600">Target: 95% under 200ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Delivery SLA</p>
              <div className="text-3xl mb-1">97.8%</div>
              <Progress value={97.8} className="mb-2" />
              <p className="text-xs text-green-600">Target: 95%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

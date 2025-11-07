'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Dashboard/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { formatNumber, formatBytes, formatDuration } from '@/utils/formatters';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function MonitoringDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [clusterConfig, setClusterConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();

      // Set up auto-refresh
      const interval = setInterval(fetchMetrics, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch various metrics in parallel
      const [queriesRes, tablesRes] = await Promise.all([
        fetch('/api/clickhouse/query-analyzer/aggregate?days=1&limit=100'),
        fetch('/api/clickhouse/databases'),
      ]);

      const queriesData = await queriesRes.json();
      const tablesData = await tablesRes.json();

      // Calculate metrics
      const recentQueries = queriesData.queries || [];
      const totalQueries = recentQueries.reduce((sum, q) => sum + q.execution_count, 0);
      const avgDuration = recentQueries.length > 0
        ? recentQueries.reduce((sum, q) => sum + q.avg_duration_ms, 0) / recentQueries.length
        : 0;
      const errorQueries = recentQueries.reduce((sum, q) => sum + q.error_count, 0);
      const totalTables = tablesData.databases?.reduce((sum, db) => sum + db.table_count, 0) || 0;

      // Query distribution by type
      const queryTypes = {};
      recentQueries.forEach((q) => {
        const type = q.query_kind || 'Unknown';
        queryTypes[type] = (queryTypes[type] || 0) + q.execution_count;
      });

      const queryTypeData = Object.entries(queryTypes).map(([name, value]) => ({
        name,
        value,
      }));

      // Top 5 slowest queries
      const slowestQueries = [...recentQueries]
        .sort((a, b) => b.p99_duration_ms - a.p99_duration_ms)
        .slice(0, 5)
        .map((q) => ({
          name: q.normalized_query?.substring(0, 30) + '...' || 'Unknown',
          duration: q.p99_duration_ms,
        }));

      // Memory usage distribution
      const memoryDistribution = recentQueries.slice(0, 10).map((q) => ({
        name: q.normalized_query?.substring(0, 20) + '...' || 'Query',
        memory: q.p99_memory_bytes / (1024 * 1024), // MB
      }));

      setMetrics({
        totalQueries,
        avgDuration,
        errorQueries,
        errorRate: totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0,
        totalTables,
        totalDatabases: tablesData.total || 0,
        queryTypeData,
        slowestQueries,
        memoryDistribution,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Error fetching monitoring metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation clusterInfo={clusterConfig} />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation clusterInfo={clusterConfig} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Real-Time Monitoring</h1>
            <p className="text-muted-foreground">
              Live metrics and performance monitoring
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {metrics?.lastUpdated}
            </div>
            <Badge variant={loading ? 'warning' : 'success'}>
              {loading ? 'Updating...' : '● Live'}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Queries (24h)</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(metrics?.totalQueries || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-3xl font-bold">{formatDuration(metrics?.avgDuration || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="text-3xl font-bold text-red-600">
                {metrics?.errorRate?.toFixed(2) || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Tables</span>
                <span className="text-2xl">📁</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(metrics?.totalTables || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Query Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Query Distribution by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.queryTypeData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.queryTypeData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Slowest Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Slowest Queries (P99)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.slowestQueries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="duration" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Memory Usage by Query (P99)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.memoryDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: 'Memory (MB)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="memory" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HealthIndicator
                label="Query Performance"
                value={metrics?.avgDuration < 1000 ? 'Good' : metrics?.avgDuration < 5000 ? 'Fair' : 'Poor'}
                status={metrics?.avgDuration < 1000 ? 'success' : metrics?.avgDuration < 5000 ? 'warning' : 'danger'}
              />
              <HealthIndicator
                label="Error Rate"
                value={metrics?.errorRate < 1 ? 'Healthy' : metrics?.errorRate < 5 ? 'Warning' : 'Critical'}
                status={metrics?.errorRate < 1 ? 'success' : metrics?.errorRate < 5 ? 'warning' : 'danger'}
              />
              <HealthIndicator
                label="System Load"
                value={metrics?.totalQueries > 10000 ? 'High' : metrics?.totalQueries > 1000 ? 'Medium' : 'Low'}
                status={metrics?.totalQueries > 10000 ? 'warning' : 'success'}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthIndicator({ label, value, status }) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    danger: '🔴',
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-2xl">{icons[status]}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

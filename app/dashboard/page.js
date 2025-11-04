'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Dashboard/Navigation';
import StatCard from '@/components/Dashboard/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatBytes, formatNumber } from '@/utils/formatters';
import Button from '@/components/ui/Button';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clusterConfig, setClusterConfig] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [stats, setStats] = useState({
    totalDatabases: 0,
    totalTables: 0,
    totalSize: 0,
  });

  useEffect(() => {
    const checkConnection = () => {
      const config = localStorage.getItem('clickhouse_config');
      if (!config) {
        router.push('/');
        return false;
      }
      return true;
    };

    if (checkConnection()) {
      const cluster = localStorage.getItem('cluster_config');
      if (cluster) {
        setClusterConfig(JSON.parse(cluster));
      }
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch databases
      const response = await fetch('/api/clickhouse/databases');
      const data = await response.json();

      if (response.ok) {
        setDatabases(data.databases);

        // Calculate stats
        const totalTables = data.databases.reduce((sum, db) => sum + db.table_count, 0);

        setStats({
          totalDatabases: data.total,
          totalTables,
          totalSize: 0, // TODO: Calculate from tables
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('clickhouse_config');
    localStorage.removeItem('cluster_config');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your ClickHouse databases</p>
          </div>
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Databases"
            value={formatNumber(stats.totalDatabases)}
            icon="🗄️"
            description="User-defined databases"
          />
          <StatCard
            title="Total Tables"
            value={formatNumber(stats.totalTables)}
            icon="📊"
            description="Across all databases"
          />
          <StatCard
            title="Cluster Status"
            value={clusterConfig?.isClustered ? 'Clustered' : 'Single Node'}
            icon={clusterConfig?.isClustered ? '🌐' : '💻'}
            description={clusterConfig?.isClustered ?
              `${clusterConfig.nodes.length} nodes` :
              'Standalone instance'}
          />
        </div>

        {/* Databases List */}
        <Card>
          <CardHeader>
            <CardTitle>Databases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {databases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No databases found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Engine</th>
                        <th className="text-left py-3 px-4 font-medium">Tables</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {databases.map((db) => (
                        <tr key={db.name} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{db.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {db.engine}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {db.table_count} tables
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/tables?database=${db.name}`)}
                            >
                              Explore
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/query-analyzer')}>
            <CardContent className="p-6">
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="font-semibold mb-1">Query Analyzer</h3>
              <p className="text-sm text-muted-foreground">
                Analyze query performance with detailed metrics
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/tables')}>
            <CardContent className="p-6">
              <div className="text-3xl mb-2">📁</div>
              <h3 className="font-semibold mb-1">Table Explorer</h3>
              <p className="text-sm text-muted-foreground">
                Browse tables, columns, and statistics
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/materialized-views')}>
            <CardContent className="p-6">
              <div className="text-3xl mb-2">👁️</div>
              <h3 className="font-semibold mb-1">Materialized Views</h3>
              <p className="text-sm text-muted-foreground">
                Explore materialized views and dependencies
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/lineage')}>
            <CardContent className="p-6">
              <div className="text-3xl mb-2">🔗</div>
              <h3 className="font-semibold mb-1">Data Lineage</h3>
              <p className="text-sm text-muted-foreground">
                Visualize data flow and dependencies
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

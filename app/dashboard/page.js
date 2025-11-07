'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Table2, Search, Clock, Eye, GitBranch, Activity, Sparkles, ArrowRight } from 'lucide-react';
import Sidebar from '@/components/Dashboard/Sidebar';
import StatCard from '@/components/Dashboard/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
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
      <div className="flex min-h-screen">
        <Sidebar clusterInfo={clusterConfig} onDisconnect={handleDisconnect} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar clusterInfo={clusterConfig} onDisconnect={handleDisconnect} />

      <main className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="gradient-hero text-white py-12 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles size={24} />
              </div>
              <h1 className="text-4xl font-bold">Dashboard</h1>
            </div>
            <p className="text-white/90 text-lg max-w-2xl">
              Overview of your ClickHouse databases and quick access to powerful tools
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-16">
            <StatCard
              title="Total Databases"
              value={formatNumber(stats.totalDatabases)}
              icon={Database}
              description="User-defined databases"
              gradient
            />
            <StatCard
              title="Total Tables"
              value={formatNumber(stats.totalTables)}
              icon={Table2}
              description="Across all databases"
              gradient
            />
            <StatCard
              title="Cluster Status"
              value={clusterConfig?.isClustered ? 'Clustered' : 'Single Node'}
              icon={Activity}
              description={clusterConfig?.isClustered ?
                `${clusterConfig.nodes.length} nodes` :
                'Standalone instance'}
              gradient
            />
          </div>

          {/* Quick Links */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              Quick Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card hover onClick={() => router.push('/query-analyzer')}>
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <Search className="text-primary" size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 flex items-center justify-between group">
                    Query Analyzer
                    <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analyze query performance with detailed metrics
                  </p>
                </CardContent>
              </Card>

              <Card hover onClick={() => router.push('/tables')}>
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-secondary/10 w-fit mb-4">
                    <Table2 className="text-secondary" size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 flex items-center justify-between group">
                    Table Explorer
                    <ArrowRight className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Browse tables, columns, and statistics
                  </p>
                </CardContent>
              </Card>

              <Card hover onClick={() => router.push('/slow-queries')}>
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-warning/10 w-fit mb-4">
                    <Clock className="text-warning" size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 flex items-center justify-between group">
                    Slow Queries
                    <ArrowRight className="text-warning opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Identify and optimize slow-running queries
                  </p>
                </CardContent>
              </Card>

              <Card hover onClick={() => router.push('/lineage')}>
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4">
                    <GitBranch className="text-accent" size={28} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 flex items-center justify-between group">
                    Data Lineage
                    <ArrowRight className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visualize data flow and dependencies
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Databases List */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="text-primary" size={24} />
              Databases
            </h2>
            <Card>
              <CardContent className="p-6">
                {databases.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground">No databases found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Name
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Engine
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Tables
                          </th>
                          <th className="text-right py-4 px-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {databases.map((db, index) => (
                          <tr
                            key={db.name}
                            className="border-b border-border hover:bg-muted/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Database className="text-primary" size={18} />
                                <span className="font-semibold">{db.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline">{db.engine}</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="info">
                                {db.table_count} {db.table_count === 1 ? 'table' : 'tables'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/tables?database=${db.name}`)}
                              >
                                Explore
                                <ArrowRight size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

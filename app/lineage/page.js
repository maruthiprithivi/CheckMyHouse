'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Dashboard/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LineageGraph from '@/components/LineageGraph/LineageGraph';

export default function DataLineage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [clusterConfig, setClusterConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [lineageData, setLineageData] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatabases();
      fetchLineageData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && (selectedDatabase || selectedDatabase === '')) {
      fetchLineageData(selectedDatabase);
    }
  }, [selectedDatabase, isAuthenticated]);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/clickhouse/databases');
      const data = await response.json();

      if (response.ok) {
        setDatabases(data.databases);
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
    }
  };

  const fetchLineageData = async (database = '') => {
    try {
      setLoading(true);
      const url = database
        ? `/api/clickhouse/lineage?database=${database}`
        : '/api/clickhouse/lineage';

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setLineageData(data);
      }
    } catch (error) {
      console.error('Error fetching lineage data:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation clusterInfo={clusterConfig} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Lineage</h1>
          <p className="text-muted-foreground">
            Visualize data flow and dependencies across tables and views
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-medium">Filter by Database:</label>
                <Select
                  value={selectedDatabase}
                  onChange={setSelectedDatabase}
                  options={[
                    { value: '', label: 'All Databases' },
                    ...databases.map(db => ({
                      value: db.name,
                      label: db.name,
                    })),
                  ]}
                  className="min-w-[200px]"
                />
              </div>

              <Button onClick={() => fetchLineageData(selectedDatabase)} variant="outline" size="sm">
                🔄 Refresh
              </Button>

              {lineageData && (
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>{lineageData.stats.tables} Tables</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>{lineageData.stats.views} Materialized Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>{lineageData.stats.totalEdges} Connections</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Graph */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[600px]">
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>
        ) : lineageData && lineageData.nodes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lineage Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <LineageGraph
                nodes={lineageData.nodes}
                edges={lineageData.edges}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <div className="text-4xl mb-4">🔗</div>
                <p className="text-muted-foreground mb-2">No dependencies found</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDatabase
                    ? `The database ${selectedDatabase} has no table dependencies or materialized views.`
                    : 'No table dependencies or materialized views found across all databases.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Navigation:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Drag to pan around the graph</li>
                  <li>• Scroll to zoom in/out</li>
                  <li>• Click and drag nodes to rearrange</li>
                  <li>• Click Fit View to see the entire graph</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Node Types:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <span className="text-blue-600 font-medium">Blue nodes</span> - Regular tables</li>
                  <li>• <span className="text-purple-600 font-medium">Purple nodes</span> - Materialized views</li>
                  <li>• <span className="text-green-600 font-medium">Arrows</span> - Data flow direction</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

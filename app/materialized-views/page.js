'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import MaterializedViewDetails from '@/components/MaterializedViews/MaterializedViewDetails';
import { formatBytes, formatNumber } from '@/utils/formatters';
import { Eye } from 'lucide-react';

export default function MaterializedViewsExplorer() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [views, setViews] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedView, setSelectedView] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatabases();
      fetchViews();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchViews(selectedDatabase);
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

  const fetchViews = async (database = '') => {
    try {
      setLoading(true);
      const url = database
        ? `/api/clickhouse/materialized-views?database=${database}`
        : '/api/clickhouse/materialized-views';

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setViews(data.views);
      }
    } catch (error) {
      console.error('Error fetching materialized views:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (view) => {
    setSelectedView(view);
  };

  const handleBack = () => {
    setSelectedView(null);
  };

  if (authLoading) {
    return null; // DashboardLayout handles loading
  }

  if (selectedView) {
    return (
      <DashboardLayout
        title="Materialized View Details"
        description={`Viewing details for ${selectedView.database}.${selectedView.name}`}
        icon={Eye}
      >
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack}>
            ← Back to Materialized Views
          </Button>
        </div>
        <MaterializedViewDetails view={selectedView} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Materialized Views"
      description="Explore materialized views, their dependencies, and transformations"
      icon={Eye}
    >

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
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
                className="max-w-md"
              />
              <Button onClick={() => fetchViews(selectedDatabase)} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Views Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {views.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No materialized views found
              </div>
            ) : (
              views.map((view) => (
                <MaterializedViewCard
                  key={`${view.database}.${view.name}`}
                  view={view}
                  onClick={() => handleViewClick(view)}
                />
              ))
            )}
          </div>
        )}
    </DashboardLayout>
  );
}

function MaterializedViewCard({ view, onClick }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">👁️</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{view.name}</h3>
            <Badge variant="outline" className="text-xs">
              {view.database}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Engine:</span>
            <span className="font-medium">{view.engine}</span>
          </div>
        </div>

        {/* Dependencies */}
        <div className="border-t pt-3 space-y-2">
          {view.sources && view.sources.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Source Tables:
              </div>
              <div className="flex flex-wrap gap-1">
                {view.sources.slice(0, 3).map((src, i) => (
                  <Badge key={i} variant="info" className="text-xs">
                    {src.database}.{src.table}
                  </Badge>
                ))}
                {view.sources.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{view.sources.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {view.targets && view.targets.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Feeds Into:
              </div>
              <div className="flex flex-wrap gap-1">
                {view.targets.slice(0, 2).map((tgt, i) => (
                  <Badge key={i} variant="success" className="text-xs">
                    {tgt.database}.{tgt.table}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full">
            View Details →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

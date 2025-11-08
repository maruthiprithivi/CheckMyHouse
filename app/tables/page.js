'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import TableDetailsView from '@/components/TableExplorer/TableDetailsView';
import { formatBytes, formatNumber } from '@/utils/formatters';
import { TABLE_ENGINES } from '@/utils/constants';
import { Table2 } from 'lucide-react';

function TableExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(searchParams.get('database') || '');
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatabases();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedDatabase) {
      fetchTables(selectedDatabase);
    }
  }, [selectedDatabase, isAuthenticated]);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/clickhouse/databases');
      const data = await response.json();

      if (response.ok) {
        setDatabases(data.databases);

        // Auto-select first database if none selected
        if (!selectedDatabase && data.databases.length > 0) {
          setSelectedDatabase(data.databases[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (database) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clickhouse/tables?database=${database}`);
      const data = await response.json();

      if (response.ok) {
        setTables(data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const handleBack = () => {
    setSelectedTable(null);
  };

  if (authLoading) {
    return null; // DashboardLayout handles loading
  }

  if (selectedTable) {
    return (
      <DashboardLayout
        title="Table Details"
        description={`Viewing details for ${selectedDatabase}.${selectedTable.name}`}
        icon={Table2}
      >
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack}>
            ← Back to Tables
          </Button>
        </div>
        <TableDetailsView
          database={selectedDatabase}
          table={selectedTable}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Table Explorer"
      description="Browse tables, columns, and detailed statistics"
      icon={Table2}
    >

        {/* Database Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <label className="font-medium">Select Database:</label>
              <Select
                value={selectedDatabase}
                onChange={setSelectedDatabase}
                options={databases.map(db => ({
                  value: db.name,
                  label: `${db.name} (${db.table_count} tables)`,
                }))}
                className="max-w-md"
              />
              <Button onClick={() => fetchTables(selectedDatabase)} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tables List */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Tables in {selectedDatabase} ({tables.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No tables found in this database
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <TableCard
                      key={table.name}
                      table={table}
                      onClick={() => handleTableClick(table)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </DashboardLayout>
  );
}

export default function TableExplorer() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TableExplorerContent />
    </Suspense>
  );
}

function TableCard({ table, onClick }) {
  const engineInfo = TABLE_ENGINES[table.engine] || TABLE_ENGINES.MergeTree;

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
      style={{ borderLeftColor: `var(--${engineInfo.color}-500, #3b82f6)` }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{engineInfo.icon}</span>
              <h3 className="font-semibold text-lg truncate">{table.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {engineInfo.description}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Engine:</span>
            <Badge variant="outline">{table.engine}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rows:</span>
            <span className="font-medium">{formatNumber(table.total_rows)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">{formatBytes(table.total_bytes)}</span>
          </div>

          {table.partition_key && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Partition Key:</div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
                {table.partition_key}
              </code>
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

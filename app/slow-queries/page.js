'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Dashboard/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { formatDuration, formatBytes, formatNumber, formatDate } from '@/utils/formatters';
import { getDurationIndicator, getMemoryIndicator } from '@/utils/performanceIndicators';
import { TIME_RANGES } from '@/utils/constants';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

export default function SlowQueries() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [clusterConfig, setClusterConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState([]);
  const [filters, setFilters] = useState({
    days: 7,
    thresholdMs: 1000,
    limit: 100,
  });
  const [expandedQuery, setExpandedQuery] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSlowQueries();
    }
  }, [isAuthenticated, filters]);

  const fetchSlowQueries = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        days: filters.days,
        threshold_ms: filters.thresholdMs,
        limit: filters.limit,
      });

      const response = await fetch(`/api/clickhouse/query-analyzer/slow-queries?${params}`);
      const data = await response.json();

      if (response.ok) {
        setQueries(data.queries);
      }
    } catch (error) {
      console.error('Error fetching slow queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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
          <h1 className="text-3xl font-bold mb-2">Slow Queries Dashboard</h1>
          <p className="text-muted-foreground">
            Identify and analyze queries that exceed performance thresholds
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Range</label>
                <Select
                  value={filters.days}
                  onChange={(value) => handleFilterChange('days', parseInt(value))}
                  options={TIME_RANGES}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Threshold (milliseconds)
                </label>
                <Input
                  type="number"
                  value={filters.thresholdMs}
                  onChange={(e) => handleFilterChange('thresholdMs', parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Results Limit</label>
                <Select
                  value={filters.limit}
                  onChange={(value) => handleFilterChange('limit', parseInt(value))}
                  options={[
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 200, label: '200' },
                    { value: 500, label: '500' },
                  ]}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {queries.length} slow queries ({'>'}{filters.thresholdMs}ms)
              </p>
              <Button onClick={fetchSlowQueries} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {!loading && queries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Slow Queries</div>
                <div className="text-3xl font-bold">{queries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Slowest Query</div>
                <div className="text-3xl font-bold">
                  {formatDuration(Math.max(...queries.map(q => q.query_duration_ms)))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
                <div className="text-3xl font-bold">
                  {formatDuration(
                    queries.reduce((sum, q) => sum + q.query_duration_ms, 0) / queries.length
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-1">With Errors</div>
                <div className="text-3xl font-bold text-red-600">
                  {queries.filter(q => q.exception).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queries List */}
        <Card>
          <CardHeader>
            <CardTitle>Slow Queries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-4">🎉</div>
                <p className="mb-2">No slow queries found!</p>
                <p className="text-sm">
                  All queries are executing faster than {filters.thresholdMs}ms
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queries.map((query, index) => (
                  <SlowQueryCard
                    key={query.query_id}
                    query={query}
                    expanded={expandedQuery === index}
                    onToggle={() => setExpandedQuery(expandedQuery === index ? null : index)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SlowQueryCard({ query, expanded, onToggle }) {
  const durationIndicator = getDurationIndicator(query.query_duration_ms);
  const memoryIndicator = getMemoryIndicator(query.memory_usage);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-foreground">
              {query.query_id.substring(0, 8)}
            </code>
            <span className="text-sm text-muted-foreground">
              {formatDate(query.event_time)}
            </span>
            {query.exception && (
              <Badge variant="danger">Error</Badge>
            )}
            <Badge variant="outline">{query.user}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>{durationIndicator.emoji}</span>
              <span className="font-bold text-lg">
                {formatDuration(query.query_duration_ms)}
              </span>
            </div>
            <button className="text-muted-foreground">
              {expanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCell label="Memory" value={formatBytes(query.memory_usage)} />
          <MetricCell label="Rows Read" value={formatNumber(query.read_rows)} />
          <MetricCell label="Bytes Read" value={formatBytes(query.read_bytes)} />
          <MetricCell label="Pattern" value={query.query_pattern?.substring(0, 12) + '...'} />
          <MetricCell
            label="Tables"
            value={query.tables?.length > 0 ? query.tables[0].join('.') : 'N/A'}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Full Query:</h4>
            <SyntaxHighlighter
              language="sql"
              style={github}
              customStyle={{
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                maxHeight: '300px',
              }}
            >
              {query.query}
            </SyntaxHighlighter>
          </div>

          {query.exception && (
            <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
              <h4 className="font-medium text-red-900 mb-1">Error:</h4>
              <pre className="text-xs text-red-800 whitespace-pre-wrap">
                {query.exception}
              </pre>
            </div>
          )}

          {query.tables && query.tables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tables Used:</h4>
              <div className="flex flex-wrap gap-2">
                {query.tables.map((table, i) => (
                  <Badge key={i} variant="outline">
                    {table.join('.')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { useRequireAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Dashboard/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AggregateQueryList from '@/components/QueryAnalyzer/AggregateQueryList';
import MetricsGrid from '@/components/QueryAnalyzer/MetricsGrid';
import InsightsPanel from '@/components/QueryAnalyzer/InsightsPanel';
import RecommendationsPanel from '@/components/Recommendations/RecommendationsPanel';
import { generateQueryOptimizations } from '@/utils/recommendations';
import QueryDrilldownView from '@/components/QueryAnalyzer/QueryDrilldownView';
import ExportMenu from '@/components/ui/ExportMenu';
import { SORT_OPTIONS, TIME_RANGES } from '@/utils/constants';
import { formatQueryMetricsForExport } from '@/utils/exportUtils';
import ErrorBoundary, { PermissionError, QuotaExceededError, FeatureUnavailable } from '@/components/ErrorBoundary';
import { CapabilityBanner } from '@/components/ui/CapabilityIndicator';

export default function QueryAnalyzer() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const [clusterConfig, setClusterConfig] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [filters, setFilters] = useState({
    days: 7,
    sortColumn: 'p99_duration_ms',
    minExecutions: 5,
    limit: 100,
    offset: 0,
  });

  // Debounce filters to prevent excessive API calls
  const [debouncedFilters] = useDebounce(filters, 500);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCapabilities();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQueries();
    }
  }, [debouncedFilters, isAuthenticated]);

  const fetchCapabilities = async () => {
    try {
      const response = await fetch('/api/clickhouse/capabilities');
      const data = await response.json();

      if (response.ok) {
        setCapabilities(data);
      }
    } catch (error) {
      console.error('Error fetching capabilities:', error);
    }
  };

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        days: filters.days,
        sort_column: filters.sortColumn,
        min_executions: filters.minExecutions,
        limit: filters.limit,
        offset: filters.offset,
      });

      const response = await fetch(`/api/clickhouse/query-analyzer/aggregate?${params}`);
      const data = await response.json();

      if (response.ok) {
        setQueries(data.queries);
        setError(null);
      } else {
        // Handle different error types
        setError({
          type: data.type,
          message: data.error,
          requirements: data.requirements,
          quotaInfo: data.quotaInfo,
          retryAfter: data.retryAfter,
          feature: data.feature,
        });
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      setError({
        type: 'UNKNOWN',
        message: error.message || 'Failed to fetch query data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset offset when filters change
    }));
  };

  const handleQueryClick = (query) => {
    setSelectedQuery(query);
  };

  const handleBack = () => {
    setSelectedQuery(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (selectedQuery) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation clusterInfo={clusterConfig} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="outline" onClick={handleBack}>
              ← Back to Query List
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Query Pattern Analysis</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Hash: {selectedQuery.normalized_query_hash.toString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-medium mb-2">Normalized Query:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {selectedQuery.normalized_query}
                </pre>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedQuery.execution_count}
                  </div>
                  <div className="text-sm text-blue-600">Executions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {((1 - selectedQuery.error_rate) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-600">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {selectedQuery.query_kind || 'N/A'}
                  </div>
                  <div className="text-sm text-purple-600">Query Type</div>
                </div>
              </div>

              <MetricsGrid data={selectedQuery} expanded={true} />
            </CardContent>
          </Card>

          <InsightsPanel queryData={selectedQuery} />

          <div className="mt-6">
            <RecommendationsPanel
              recommendations={generateQueryOptimizations(selectedQuery)}
              title="Query Optimizations"
            />
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Executions Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <QueryDrilldownView
                  queryHash={selectedQuery.normalized_query_hash.toString()}
                  queryPattern={selectedQuery.normalized_query}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navigation clusterInfo={clusterConfig} />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Query Analyzer</h1>
            <p className="text-muted-foreground">
              Comprehensive query performance analysis with percentile metrics
            </p>
          </div>

          {/* Capability Banner */}
          {capabilities && <CapabilityBanner capabilities={capabilities} />}

          {/* Error Handling */}
          {error && error.type === 'PERMISSION_DENIED' && (
            <PermissionError
              feature={error.feature || 'Query Analyzer'}
              table="system.query_log"
              requirements={error.requirements}
              onDismiss={() => setError(null)}
            />
          )}

          {error && error.type === 'QUOTA_EXCEEDED' && (
            <QuotaExceededError
              quotaInfo={error.quotaInfo}
              retryAfter={error.retryAfter}
              onRetry={fetchQueries}
            />
          )}

          {error && error.type === 'PERMISSION_DENIED' && (
            <div className="mb-6">
              <PermissionError
                feature="Query Analyzer"
                table="system.query_log"
                requirements={error.requirements}
                onDismiss={() => router.push('/dashboard')}
              />
            </div>
          )}

          {error && !['PERMISSION_DENIED', 'QUOTA_EXCEEDED'].includes(error.type) && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="font-semibold">Error</h4>
                </div>
                <p className="text-red-700">{error.message}</p>
                <Button onClick={fetchQueries} className="mt-4" size="sm">
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {!error && (
            <>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Range</label>
                <Select
                  value={filters.days}
                  onChange={(value) => handleFilterChange('days', parseInt(value))}
                  options={TIME_RANGES}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select
                  value={filters.sortColumn}
                  onChange={(value) => handleFilterChange('sortColumn', value)}
                  options={SORT_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Min Executions</label>
                <Input
                  type="number"
                  value={filters.minExecutions}
                  onChange={(e) => handleFilterChange('minExecutions', parseInt(e.target.value))}
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
                Showing {queries.length} queries
              </p>
              <div className="flex gap-2">
                <ExportMenu
                  data={queries}
                  filename={`query-analysis-${new Date().toISOString().split('T')[0]}`}
                  formatData={formatQueryMetricsForExport}
                />
                <Button onClick={fetchQueries} variant="outline" size="sm">
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Query List */}
          <Card>
            <CardHeader>
              <CardTitle>Aggregated Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <AggregateQueryList
                  queries={queries}
                  onQueryClick={handleQueryClick}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
          </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

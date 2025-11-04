'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { formatDuration, formatBytes, formatNumber, formatDate } from '@/utils/formatters';
import { getDurationIndicator, getMemoryIndicator } from '@/utils/performanceIndicators';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

export default function QueryDrilldownView({ queryHash, queryPattern, onBack }) {
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState([]);
  const [sortColumn, setSortColumn] = useState('query_duration_ms');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchExecutions();
  }, [queryHash, sortColumn]);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        hash: queryHash,
        days: 7,
        sort_column: sortColumn,
        limit: 100,
        offset: 0,
      });

      const response = await fetch(`/api/clickhouse/query-analyzer/drilldown?${params}`);
      const data = await response.json();

      if (response.ok) {
        setExecutions(data.executions);
      }
    } catch (error) {
      console.error('Error fetching query executions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = executions
    .slice(0, 50)
    .reverse()
    .map((exec) => ({
      time: new Date(exec.event_time).toLocaleTimeString(),
      duration: exec.query_duration_ms,
      memory: exec.memory_usage / (1024 * 1024), // Convert to MB
    }));

  const sortOptions = [
    { value: 'query_duration_ms', label: 'Duration' },
    { value: 'memory_usage', label: 'Memory Usage' },
    { value: 'read_rows', label: 'Rows Read' },
    { value: 'read_bytes', label: 'Bytes Read' },
    { value: 'event_time', label: 'Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Query Duration Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Duration (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'MB', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Memory (MB)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Individual Executions ({executions.length})</CardTitle>
            <Select
              value={sortColumn}
              onChange={setSortColumn}
              options={sortOptions}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map((exec, index) => (
                <ExecutionRow
                  key={exec.query_id}
                  execution={exec}
                  expanded={expandedRow === index}
                  onToggle={() => setExpandedRow(expandedRow === index ? null : index)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutionRow({ execution, expanded, onToggle }) {
  const durationIndicator = getDurationIndicator(execution.query_duration_ms);
  const memoryIndicator = getMemoryIndicator(execution.memory_usage);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <code className="text-xs text-muted-foreground">{execution.query_id.substring(0, 8)}</code>
            <span className="text-sm text-muted-foreground">{formatDate(execution.event_time)}</span>
            {execution.exception && (
              <Badge variant="danger">Error</Badge>
            )}
          </div>
          <button className="text-sm text-muted-foreground">
            {expanded ? '▼' : '▶'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCell
            label="Duration"
            value={formatDuration(execution.query_duration_ms)}
            indicator={durationIndicator}
          />
          <MetricCell
            label="Memory"
            value={formatBytes(execution.memory_usage)}
            indicator={memoryIndicator}
          />
          <MetricCell
            label="Rows Read"
            value={formatNumber(execution.read_rows)}
          />
          <MetricCell
            label="Bytes Read"
            value={formatBytes(execution.read_bytes)}
          />
          <MetricCell
            label="CPU User"
            value={`${execution.cpu_user_seconds?.toFixed(2)}s`}
          />
          <MetricCell
            label="CPU Wait"
            value={`${execution.cpu_wait_seconds?.toFixed(2)}s`}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* SQL Query */}
          <div>
            <h4 className="font-medium mb-2">Query:</h4>
            <SyntaxHighlighter
              language="sql"
              style={github}
              customStyle={{
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                maxHeight: '200px',
              }}
            >
              {execution.query}
            </SyntaxHighlighter>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailMetric label="Query ID" value={execution.query_id} />
            <DetailMetric label="User" value={execution.user} />
            <DetailMetric label="Result Rows" value={formatNumber(execution.result_rows)} />
            <DetailMetric label="Result Bytes" value={formatBytes(execution.result_bytes)} />
            <DetailMetric label="Peak Memory" value={formatBytes(execution.peak_memory_usage)} />
            <DetailMetric label="Written Rows" value={formatNumber(execution.written_rows)} />
            <DetailMetric label="CPU System" value={`${execution.cpu_system_seconds?.toFixed(2)}s`} />
            <DetailMetric label="I/O Read" value={formatBytes(execution.io_read_bytes)} />
            <DetailMetric label="I/O Write" value={formatBytes(execution.io_write_bytes)} />
            <DetailMetric label="Network Send" value={formatBytes(execution.network_send_bytes)} />
            <DetailMetric label="Network Receive" value={formatBytes(execution.network_receive_bytes)} />
            <DetailMetric
              label="Cache Efficiency"
              value={
                execution.disk_cache_hits + execution.disk_cache_misses > 0
                  ? `${((execution.disk_cache_hits / (execution.disk_cache_hits + execution.disk_cache_misses)) * 100).toFixed(1)}%`
                  : 'N/A'
              }
            />
          </div>

          {/* Tables */}
          {execution.tables && execution.tables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tables:</h4>
              <div className="flex flex-wrap gap-2">
                {execution.tables.map((table, i) => (
                  <Badge key={i} variant="outline">
                    {table.join('.')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {execution.exception && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-900 mb-1">Error:</h4>
              <pre className="text-xs text-red-800 whitespace-pre-wrap">
                {execution.exception}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value, indicator }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {indicator && <span className="text-xs">{indicator.emoji}</span>}
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium break-all">{value}</div>
    </div>
  );
}

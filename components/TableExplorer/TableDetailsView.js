'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { formatBytes, formatNumber, formatDate } from '@/utils/formatters';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

export default function TableDetailsView({ database, table }) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('schema');

  useEffect(() => {
    fetchTableDetails();
    fetchTableStats();
  }, [database, table.name]);

  const fetchTableDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/clickhouse/tables?database=${database}&table=${table.name}&details=true`
      );
      const data = await response.json();

      if (response.ok) {
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableStats = async () => {
    try {
      const response = await fetch(
        `/api/clickhouse/stats?database=${database}&table=${table.name}`
      );
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching table stats:', error);
    }
  };

  const tabs = [
    { id: 'schema', label: 'Schema', icon: '📋' },
    { id: 'statistics', label: 'Statistics', icon: '📊' },
    { id: 'parts', label: 'Parts & Partitions', icon: '🧩' },
    { id: 'ddl', label: 'DDL', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {database}.{table.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="info">{table.engine}</Badge>
                {table.engine_full && (
                  <span className="text-sm text-muted-foreground">
                    {table.engine_full}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem
              label="Total Rows"
              value={formatNumber(table.total_rows)}
              icon="📊"
            />
            <StatItem
              label="Total Size"
              value={formatBytes(table.total_bytes)}
              icon="💾"
            />
            <StatItem
              label="Lifetime Rows"
              value={formatNumber(table.lifetime_rows)}
              icon="🔄"
            />
            <StatItem
              label="Last Modified"
              value={formatDate(table.metadata_modification_time)}
              icon="🕐"
            />
          </div>

          {/* Key Information */}
          {(table.partition_key || table.sorting_key || table.primary_key) && (
            <div className="mt-6 space-y-3">
              {table.partition_key && (
                <KeyDisplay label="Partition Key" value={table.partition_key} />
              )}
              {table.sorting_key && (
                <KeyDisplay label="Sorting Key" value={table.sorting_key} />
              )}
              {table.primary_key && (
                <KeyDisplay label="Primary Key" value={table.primary_key} />
              )}
              {table.sampling_key && (
                <KeyDisplay label="Sampling Key" value={table.sampling_key} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div>
          {activeTab === 'schema' && details && (
            <SchemaTab columns={details.columns} />
          )}
          {activeTab === 'statistics' && stats && (
            <StatisticsTab stats={stats} />
          )}
          {activeTab === 'parts' && details && (
            <PartsTab parts={details.parts} />
          )}
          {activeTab === 'ddl' && (
            <DDLTab ddl={table.create_table_query} />
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function KeyDisplay({ label, value }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}:</div>
      <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
        {value}
      </code>
    </div>
  );
}

function SchemaTab({ columns }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Columns ({columns.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Default</th>
                <th className="text-left py-3 px-4 font-medium">Keys</th>
                <th className="text-left py-3 px-4 font-medium">Codec</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-medium">{col.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{col.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {col.default_kind && (
                      <div className="flex flex-col">
                        <Badge variant="secondary" className="mb-1 w-fit">
                          {col.default_kind}
                        </Badge>
                        {col.default_expression && (
                          <code className="text-xs">{col.default_expression}</code>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {col.is_in_partition_key && (
                        <Badge variant="info" className="text-xs">PART</Badge>
                      )}
                      {col.is_in_sorting_key && (
                        <Badge variant="success" className="text-xs">SORT</Badge>
                      )}
                      {col.is_in_primary_key && (
                        <Badge variant="warning" className="text-xs">PK</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {col.codec_expression || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatisticsTab({ stats }) {
  const compressionRatio = stats.total_uncompressed_bytes > 0
    ? (stats.total_uncompressed_bytes / stats.total_compressed_bytes).toFixed(2)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow label="Total Rows" value={formatNumber(stats.total_rows)} />
          <StatRow label="Disk Size" value={formatBytes(stats.total_bytes_on_disk)} />
          <StatRow label="Compressed" value={formatBytes(stats.total_compressed_bytes)} />
          <StatRow label="Uncompressed" value={formatBytes(stats.total_uncompressed_bytes)} />
          <StatRow label="Compression Ratio" value={`${compressionRatio}x`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parts & Partitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatRow label="Total Parts" value={formatNumber(stats.total_parts)} />
          <StatRow label="Partitions" value={formatNumber(stats.total_partitions)} />
          <StatRow label="Last Modified" value={formatDate(stats.last_modified)} />
          {stats.min_date && stats.max_date && (
            <>
              <StatRow label="Date Range From" value={formatDate(stats.min_date)} />
              <StatRow label="Date Range To" value={formatDate(stats.max_date)} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PartsTab({ parts }) {
  if (!parts || parts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No parts information available for this table
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts ({parts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Partition</th>
                <th className="text-left py-3 px-4 font-medium">Part Name</th>
                <th className="text-right py-3 px-4 font-medium">Rows</th>
                <th className="text-right py-3 px-4 font-medium">Size</th>
                <th className="text-right py-3 px-4 font-medium">Compressed</th>
                <th className="text-right py-3 px-4 font-medium">Level</th>
                <th className="text-left py-3 px-4 font-medium">Modified</th>
              </tr>
            </thead>
            <tbody>
              {parts.slice(0, 50).map((part, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-mono">{part.partition}</td>
                  <td className="py-2 px-4 font-mono text-xs">{part.name}</td>
                  <td className="py-2 px-4 text-right">{formatNumber(part.rows)}</td>
                  <td className="py-2 px-4 text-right">{formatBytes(part.bytes_on_disk)}</td>
                  <td className="py-2 px-4 text-right">
                    {formatBytes(part.data_compressed_bytes)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <Badge variant="outline">{part.level}</Badge>
                  </td>
                  <td className="py-2 px-4">{formatDate(part.modification_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parts.length > 50 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 50 of {parts.length} parts
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DDLTab({ ddl }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CREATE TABLE Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <SyntaxHighlighter
          language="sql"
          style={github}
          customStyle={{
            padding: '1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {ddl}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

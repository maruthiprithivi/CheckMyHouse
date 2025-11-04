'use client';

import { useState } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { formatDuration, formatBytes, formatNumber, truncateString } from '@/utils/formatters';
import { getDurationIndicator, getMemoryIndicator } from '@/utils/performanceIndicators';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function AggregateQueryList({ queries, onQueryClick, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading queries...</div>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No queries found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting the filters or time range
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-[600px]">
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={queries.length}
              itemSize={120}
              itemData={{ queries, onQueryClick }}
            >
              {QueryRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

function QueryRow({ index, style, data }) {
  const { queries, onQueryClick } = data;
  const query = queries[index];

  const durationIndicator = getDurationIndicator(query.p99_duration_ms);
  const memoryIndicator = getMemoryIndicator(query.p99_memory_bytes);

  return (
    <div
      style={style}
      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onQueryClick(query)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-xs text-muted-foreground font-mono">
                {query.normalized_query_hash.toString().substring(0, 8)}
              </code>
              {query.error_count > 0 && (
                <Badge variant="danger">
                  {query.error_count} errors
                </Badge>
              )}
            </div>
            <p className="text-sm font-mono text-gray-700 truncate">
              {truncateString(query.normalized_query, 100)}
            </p>
            {query.sample_tables && query.sample_tables.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Tables:</span>
                {query.sample_tables.slice(0, 3).map((table, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {table.join('.')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4">
            <Badge variant="info">
              {formatNumber(query.execution_count)} executions
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-2">
          <MetricBadge
            label="P99 Latency"
            value={formatDuration(query.p99_duration_ms)}
            indicator={durationIndicator}
          />
          <MetricBadge
            label="P99 Memory"
            value={formatBytes(query.p99_memory_bytes)}
            indicator={memoryIndicator}
          />
          <MetricBadge
            label="Avg Rows"
            value={formatNumber(query.avg_read_rows)}
          />
          <MetricBadge
            label="Total CPU"
            value={`${query.total_cpu_user_seconds?.toFixed(1)}s`}
          />
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ label, value, indicator }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {indicator && <span className="text-sm">{indicator.emoji}</span>}
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

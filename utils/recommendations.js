/**
 * Advanced recommendations engine for query and table optimizations
 */

import { formatBytes, formatNumber } from './formatters';

/**
 * Generate index recommendations for a table
 */
export function generateIndexRecommendations(table, queries = []) {
  const recommendations = [];

  // Analyze queries that use this table
  const tableQueries = queries.filter((q) =>
    q.sample_tables?.some((t) => t.join('.') === `${table.database}.${table.name}`)
  );

  if (tableQueries.length === 0) {
    return recommendations;
  }

  // Check for full table scans
  const scanQueries = tableQueries.filter((q) => q.result_efficiency < 0.01);
  if (scanQueries.length > 0) {
    recommendations.push({
      type: 'critical',
      category: 'Index Recommendation',
      title: 'Add Skip Index or Bloom Filter',
      description: `${scanQueries.length} queries scan most of the table (efficiency < 1%)`,
      impact: 'High',
      effort: 'Medium',
      suggestion: `Consider adding a skip index or bloom filter on frequently filtered columns to improve query selectivity.`,
      queries: scanQueries.length,
    });
  }

  // Check for ORDER BY without sorting key
  if (!table.sorting_key) {
    const sortQueries = tableQueries.filter((q) =>
      q.normalized_query?.includes('ORDER BY')
    );
    if (sortQueries.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'Sorting Optimization',
        title: 'Define Sorting Key',
        description: 'Table has no sorting key but queries use ORDER BY',
        impact: 'Medium',
        effort: 'Low',
        suggestion: 'Add a sorting key that matches common ORDER BY patterns to avoid runtime sorting.',
        queries: sortQueries.length,
      });
    }
  }

  // Check partition key usage
  if (!table.partition_key) {
    recommendations.push({
      type: 'info',
      category: 'Partitioning',
      title: 'Consider Partitioning',
      description: 'Table is not partitioned',
      impact: 'Medium',
      effort: 'High',
      suggestion: 'Add a partition key (typically by date) to enable efficient data pruning and TTL management.',
    });
  }

  return recommendations;
}

/**
 * Generate query optimization recommendations
 */
export function generateQueryOptimizations(queryData) {
  const optimizations = [];

  // High I/O wait
  if (queryData.io_wait_ratio > 0.5) {
    optimizations.push({
      type: 'critical',
      category: 'I/O Optimization',
      title: 'High I/O Wait Time',
      description: `Query spends ${(queryData.io_wait_ratio * 100).toFixed(0)}% waiting on I/O`,
      recommendations: [
        'Check disk performance and consider faster storage (SSD)',
        'Review concurrent I/O operations',
        'Optimize table storage format (compression codec)',
        'Consider pre-aggregation with materialized views',
      ],
    });
  }

  // Poor cache performance
  if (queryData.disk_cache_hit_rate < 0.5) {
    optimizations.push({
      type: 'warning',
      category: 'Cache Optimization',
      title: 'Low Cache Hit Rate',
      description: `Only ${(queryData.disk_cache_hit_rate * 100).toFixed(0)}% of disk reads from cache`,
      recommendations: [
        'Increase cache size if memory available',
        'Review query frequency and data access patterns',
        'Consider query result caching',
        'Optimize working set to fit in available cache',
      ],
    });
  }

  // Inefficient scans
  if (queryData.result_efficiency < 0.01) {
    const scanRatio = Math.round(1 / queryData.result_efficiency);
    optimizations.push({
      type: 'critical',
      category: 'Query Selectivity',
      title: 'Inefficient Table Scan',
      description: `Query reads ${scanRatio}x more rows than it returns`,
      recommendations: [
        'Add skip index (minmax, set, bloom_filter) on filter columns',
        'Improve WHERE clause selectivity',
        'Consider partitioning by frequently filtered columns',
        'Add projection for common query patterns',
        'Review primary key and sorting key alignment',
      ],
    });
  }

  // High memory usage
  if (queryData.avg_memory_per_row > 10240) {
    optimizations.push({
      type: 'warning',
      category: 'Memory Optimization',
      title: 'High Memory per Row',
      description: `Using ${formatBytes(queryData.avg_memory_per_row)} per row`,
      recommendations: [
        'Optimize data types (use smaller types where possible)',
        'Review GROUP BY cardinality',
        'Consider LowCardinality for string columns with few unique values',
        'Use appropriate compression codecs',
        'For aggregations, use AggregatingMergeTree',
      ],
    });
  }

  // High network traffic
  if (queryData.total_network_send_bytes > 1073741824) {
    optimizations.push({
      type: 'warning',
      category: 'Distributed Query',
      title: 'High Network Traffic',
      description: `Transferring ${formatBytes(queryData.total_network_send_bytes)} across network`,
      recommendations: [
        'Review sharding key distribution',
        'Use GLOBAL IN for distributed joins',
        'Consider data co-location',
        'Use distributed_group_by_no_merge when appropriate',
        'Add local table sampling for large result sets',
      ],
    });
  }

  // Slow queries
  if (queryData.p99_duration_ms > 10000) {
    optimizations.push({
      type: 'critical',
      category: 'Performance',
      title: 'Slow Query Performance',
      description: `P99 latency is ${(queryData.p99_duration_ms / 1000).toFixed(1)} seconds`,
      recommendations: [
        'Analyze query execution plan with EXPLAIN',
        'Check for missing indexes',
        'Consider materialized views for complex aggregations',
        'Optimize JOIN operations (order, algorithm)',
        'Review query complexity and simplify if possible',
      ],
    });
  }

  // Thread inefficiency
  if (queryData.avg_thread_count > 8 && queryData.cpu_efficiency_ratio < 0.5) {
    optimizations.push({
      type: 'info',
      category: 'Parallelization',
      title: 'Poor Thread Utilization',
      description: `Using ${queryData.avg_thread_count.toFixed(0)} threads but only ${(queryData.cpu_efficiency_ratio * 100).toFixed(0)}% CPU efficiency`,
      recommendations: [
        'Check for serialization bottlenecks',
        'Review data distribution across nodes',
        'Consider reducing max_threads setting',
        'Investigate lock contention',
      ],
    });
  }

  return optimizations;
}

/**
 * Generate table health recommendations
 */
export function generateTableHealthRecommendations(stats) {
  const recommendations = [];

  if (!stats) return recommendations;

  // Too many parts
  const partsPerPartition = stats.total_partitions > 0
    ? stats.total_parts / stats.total_partitions
    : stats.total_parts;

  if (partsPerPartition > 100) {
    recommendations.push({
      type: 'critical',
      category: 'Table Maintenance',
      title: 'Excessive Parts',
      description: `${formatNumber(stats.total_parts)} active parts (${partsPerPartition.toFixed(0)} per partition)`,
      recommendations: [
        'Run OPTIMIZE TABLE to merge parts',
        'Review insert frequency and batch size',
        'Adjust parts_to_delay_insert and parts_to_throw_insert settings',
        'Consider increasing min_bytes_for_wide_part',
      ],
    });
  }

  // Poor compression ratio
  if (stats.total_compressed_bytes > 0 && stats.total_uncompressed_bytes > 0) {
    const compressionRatio = stats.total_uncompressed_bytes / stats.total_compressed_bytes;

    if (compressionRatio < 2) {
      recommendations.push({
        type: 'info',
        category: 'Storage Optimization',
        title: 'Low Compression Ratio',
        description: `Compression ratio is only ${compressionRatio.toFixed(2)}x`,
        recommendations: [
          'Review compression codec settings',
          'Consider LZ4HC or ZSTD for better compression',
          'Check data types (use appropriate sizes)',
          'Evaluate if data is already compressed',
        ],
      });
    }
  }

  return recommendations;
}

/**
 * Generate materialized view recommendations
 */
export function generateMVRecommendations(queries) {
  const recommendations = [];

  // Find repeated aggregation patterns
  const aggQueries = queries.filter(q =>
    q.normalized_query?.includes('GROUP BY') ||
    /sum\(|count\(|avg\(/i.test(q.normalized_query || '')
  );

  if (aggQueries.length > 5) {
    const totalExecutions = aggQueries.reduce((sum, q) => sum + q.execution_count, 0);

    recommendations.push({
      type: 'info',
      category: 'Materialized View Opportunity',
      title: 'Frequent Aggregations Detected',
      description: `${aggQueries.length} aggregation queries executed ${formatNumber(totalExecutions)} times`,
      recommendations: [
        'Consider creating materialized views for common aggregations',
        'Use AggregatingMergeTree for incremental aggregations',
        'Pre-compute expensive GROUP BY operations',
        'Reduce query latency by 10-100x with MVs',
      ],
    });
  }

  return recommendations;
}

/**
 * Get recommendation severity color
 */
export function getRecommendationColor(type) {
  const colors = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '🔴',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
    },
  };

  return colors[type] || colors.info;
}

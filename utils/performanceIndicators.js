/**
 * Performance indicator thresholds and color coding
 */

export const THRESHOLDS = {
  // Duration (milliseconds)
  duration: {
    excellent: 100,
    good: 1000,
    warning: 5000,
    critical: 10000,
  },
  // Memory (bytes)
  memory: {
    excellent: 104857600, // 100MB
    good: 1073741824, // 1GB
    warning: 5368709120, // 5GB
    critical: 10737418240, // 10GB
  },
  // CPU wait ratio
  cpuWaitRatio: {
    excellent: 0.1,
    good: 0.3,
    warning: 0.5,
    critical: 0.7,
  },
  // Cache hit rate
  cacheHitRate: {
    excellent: 0.95,
    good: 0.8,
    warning: 0.5,
    critical: 0.3,
  },
  // Result efficiency (result rows / read rows)
  resultEfficiency: {
    excellent: 0.5,
    good: 0.1,
    warning: 0.01,
    critical: 0.001,
  },
  // Rows per second
  rowsPerSecond: {
    excellent: 1000000,
    good: 100000,
    warning: 10000,
    critical: 1000,
  },
};

/**
 * Get performance level for a metric
 */
export function getPerformanceLevel(value, metric, inverted = false) {
  const thresholds = THRESHOLDS[metric];
  if (!thresholds) return 'unknown';

  if (inverted) {
    // For metrics where higher is better (cache hit rate, result efficiency)
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  } else {
    // For metrics where lower is better (duration, memory, cpu wait)
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  }
}

/**
 * Get color for performance level
 */
export function getPerformanceColor(level) {
  const colors = {
    excellent: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
    },
    good: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    unknown: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      dot: 'bg-gray-500',
    },
  };

  return colors[level] || colors.unknown;
}

/**
 * Get emoji indicator for performance
 */
export function getPerformanceEmoji(level) {
  const emojis = {
    excellent: '🟢',
    good: '🔵',
    warning: '🟡',
    critical: '🔴',
    unknown: '⚪',
  };

  return emojis[level] || emojis.unknown;
}

/**
 * Get duration indicator
 */
export function getDurationIndicator(durationMs) {
  const level = getPerformanceLevel(durationMs, 'duration');
  return {
    level,
    emoji: getPerformanceEmoji(level),
    colors: getPerformanceColor(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
  };
}

/**
 * Get memory indicator
 */
export function getMemoryIndicator(memoryBytes) {
  const level = getPerformanceLevel(memoryBytes, 'memory');
  return {
    level,
    emoji: getPerformanceEmoji(level),
    colors: getPerformanceColor(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
  };
}

/**
 * Get CPU wait indicator
 */
export function getCPUWaitIndicator(waitRatio) {
  const level = getPerformanceLevel(waitRatio, 'cpuWaitRatio');
  return {
    level,
    emoji: getPerformanceEmoji(level),
    colors: getPerformanceColor(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
    isIOBound: waitRatio > 0.5,
  };
}

/**
 * Get cache hit rate indicator
 */
export function getCacheIndicator(hitRate) {
  const level = getPerformanceLevel(hitRate, 'cacheHitRate', true);
  return {
    level,
    emoji: getPerformanceEmoji(level),
    colors: getPerformanceColor(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
  };
}

/**
 * Get result efficiency indicator
 */
export function getEfficiencyIndicator(efficiency) {
  const level = getPerformanceLevel(efficiency, 'resultEfficiency', true);
  return {
    level,
    emoji: getPerformanceEmoji(level),
    colors: getPerformanceColor(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
    isInefficient: efficiency < 0.01,
  };
}

/**
 * Generate insights for query performance
 */
export function generateQueryInsights(queryData) {
  const insights = [];

  // High I/O wait
  if (queryData.io_wait_ratio > 0.5) {
    insights.push({
      severity: 'warning',
      category: 'I/O Bottleneck',
      message: `Query spends ${(queryData.io_wait_ratio * 100).toFixed(1)}% of time waiting on I/O`,
      recommendations: [
        'Check if data is properly distributed across disks',
        'Consider adding SSDs for hot data',
        'Review disk cache configuration',
        'Check for concurrent I/O heavy operations',
      ],
    });
  }

  // Low cache hit rate
  if (queryData.disk_cache_hit_rate < 0.5) {
    insights.push({
      severity: 'critical',
      category: 'Cache Inefficiency',
      message: `Disk cache hit rate is only ${(queryData.disk_cache_hit_rate * 100).toFixed(1)}%`,
      recommendations: [
        'Increase cache size if memory available',
        'Check if working set fits in cache',
        'Consider query result caching',
        'Review data access patterns',
      ],
    });
  }

  // Poor selectivity
  if (queryData.result_efficiency < 0.01) {
    insights.push({
      severity: 'critical',
      category: 'Inefficient Scan',
      message: `Query scans ${Math.round(1 / queryData.result_efficiency)}x more rows than it returns`,
      recommendations: [
        'Add appropriate indexes (skip index, bloom filter)',
        'Improve WHERE clause selectivity',
        'Consider partitioning by frequently filtered columns',
        'Add projections for common query patterns',
      ],
    });
  }

  // High memory per row
  if (queryData.avg_memory_per_row > 10240) {
    insights.push({
      severity: 'warning',
      category: 'High Memory Usage',
      message: `Using ${(queryData.avg_memory_per_row / 1024).toFixed(2)} KB per row processed`,
      recommendations: [
        'Check for large string operations',
        'Review GROUP BY cardinality',
        'Consider using aggregating merge tree',
        'Optimize data types (use smaller types where possible)',
      ],
    });
  }

  // High network traffic
  if (queryData.total_network_send_bytes > 1073741824) {
    insights.push({
      severity: 'warning',
      category: 'Network Overhead',
      message: `Query transfers ${(queryData.total_network_send_bytes / 1073741824).toFixed(2)} GB across network`,
      recommendations: [
        'Review sharding key distribution',
        'Consider using GLOBAL IN instead of regular IN',
        'Check if data can be co-located',
        'Use distributed_group_by_no_merge setting if appropriate',
      ],
    });
  }

  // Slow query
  if (queryData.p99_duration_ms > 10000) {
    insights.push({
      severity: 'critical',
      category: 'Slow Query',
      message: `P99 latency is ${(queryData.p99_duration_ms / 1000).toFixed(2)} seconds`,
      recommendations: [
        'Review query execution plan',
        'Check for missing indexes',
        'Consider materialized views for common aggregations',
        'Optimize JOIN operations',
      ],
    });
  }

  return insights;
}

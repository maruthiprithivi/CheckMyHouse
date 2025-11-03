/**
 * Application constants
 */

// Memory management
export const MEMORY_LIMITS = {
  MAX_CACHE_SIZE: 50,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  PAGE_SIZE: 100,
  VIRTUAL_LIST_ITEM_SIZE: 60,
  MAX_CHART_POINTS: 200,
};

// API limits
export const API_LIMITS = {
  MAX_ROWS: 10000,
  MAX_RESPONSE_SIZE: 5 * 1024 * 1024, // 5MB
  REQUEST_TIMEOUT: 300000, // 5 minutes
};

// Query analyzer
export const QUERY_ANALYZER_CONFIG = {
  DEFAULT_DAYS: 7,
  MIN_EXECUTIONS: 5,
  SLOW_QUERY_THRESHOLD_MS: 1000,
  MEMORY_HOG_THRESHOLD_BYTES: 1073741824, // 1GB
  IO_THRESHOLD_BYTES: 1073741824, // 1GB
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  DURATION_WARNING_MS: 1000,
  DURATION_CRITICAL_MS: 5000,
  MEMORY_WARNING_BYTES: 1073741824, // 1GB
  MEMORY_CRITICAL_BYTES: 5368709120, // 5GB
  CPU_WAIT_WARNING_RATIO: 0.3,
  CPU_WAIT_CRITICAL_RATIO: 0.5,
  CACHE_HIT_WARNING: 0.7,
  CACHE_HIT_CRITICAL: 0.5,
};

// Sort options for query analyzer
export const SORT_OPTIONS = [
  // Execution
  { value: 'execution_count', label: 'Execution Count' },

  // Duration
  { value: 'avg_duration_ms', label: 'Avg Duration' },
  { value: 'p50_duration_ms', label: 'P50 Duration' },
  { value: 'p90_duration_ms', label: 'P90 Duration' },
  { value: 'p95_duration_ms', label: 'P95 Duration' },
  { value: 'p99_duration_ms', label: 'P99 Duration' },
  { value: 'max_duration_ms', label: 'Max Duration' },

  // Memory
  { value: 'avg_memory_bytes', label: 'Avg Memory' },
  { value: 'max_memory_bytes', label: 'Max Memory' },
  { value: 'p90_memory_bytes', label: 'P90 Memory' },
  { value: 'p99_memory_bytes', label: 'P99 Memory' },

  // I/O
  { value: 'total_read_bytes', label: 'Total Read' },
  { value: 'avg_read_bytes', label: 'Avg Read' },
  { value: 'total_written_rows', label: 'Total Written' },

  // CPU
  { value: 'total_cpu_user_seconds', label: 'Total CPU Time' },
  { value: 'avg_cpu_user_seconds', label: 'Avg CPU Time' },
  { value: 'avg_cpu_wait_seconds', label: 'Avg CPU Wait' },

  // Temporal
  { value: 'last_seen', label: 'Last Seen' },
  { value: 'first_seen', label: 'First Seen' },

  // Errors
  { value: 'error_count', label: 'Error Count' },
];

// Time ranges
export const TIME_RANGES = [
  { value: 1, label: 'Last 24 hours' },
  { value: 3, label: 'Last 3 days' },
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];

// Table engines
export const TABLE_ENGINES = {
  MergeTree: {
    icon: '📊',
    color: 'blue',
    description: 'Standard MergeTree engine',
  },
  ReplicatedMergeTree: {
    icon: '🔄',
    color: 'green',
    description: 'Replicated MergeTree',
  },
  AggregatingMergeTree: {
    icon: '📈',
    color: 'purple',
    description: 'Pre-aggregated data',
  },
  CollapsingMergeTree: {
    icon: '🔀',
    color: 'orange',
    description: 'Collapsing states',
  },
  ReplacingMergeTree: {
    icon: '♻️',
    color: 'teal',
    description: 'Replace duplicates',
  },
  SummingMergeTree: {
    icon: '➕',
    color: 'indigo',
    description: 'Sum numeric columns',
  },
  MaterializedView: {
    icon: '👁️',
    color: 'pink',
    description: 'Materialized view',
  },
  Distributed: {
    icon: '🌐',
    color: 'red',
    description: 'Distributed table',
  },
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
};

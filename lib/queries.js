/**
 * ClickHouse Query Templates
 * All queries support cluster-aware execution via {table} placeholder
 */

// ============================================
// DATABASE & TABLE DISCOVERY
// ============================================

export const GET_DATABASES = `
  SELECT
    name,
    engine,
    data_path,
    metadata_path,
    uuid
  FROM system.databases
  WHERE name NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
  ORDER BY name
`;

export const GET_TABLES = `
  SELECT
    database,
    name,
    engine,
    total_rows,
    total_bytes,
    lifetime_rows,
    lifetime_bytes,
    metadata_modification_time,
    create_table_query,
    engine_full,
    partition_key,
    sorting_key,
    primary_key,
    sampling_key
  FROM system.tables
  WHERE database = '{database}'
    AND engine NOT IN ('View', 'Dictionary')
  ORDER BY name
`;

export const GET_TABLE_COLUMNS = `
  SELECT
    name,
    type,
    default_kind,
    default_expression,
    comment,
    codec_expression,
    ttl_expression,
    is_in_partition_key,
    is_in_sorting_key,
    is_in_primary_key,
    is_in_sampling_key
  FROM system.columns
  WHERE database = '{database}'
    AND table = '{table}'
  ORDER BY position
`;

export const GET_TABLE_PARTS = `
  SELECT
    partition,
    name,
    rows,
    bytes_on_disk,
    data_compressed_bytes,
    data_uncompressed_bytes,
    marks,
    modification_time,
    min_date,
    max_date,
    level,
    primary_key_bytes_in_memory
  FROM system.parts
  WHERE database = '{database}'
    AND table = '{table}'
    AND active = 1
  ORDER BY modification_time DESC
  LIMIT 1000
`;

// ============================================
// COMPREHENSIVE QUERY ANALYZER
// ============================================

export const QUERY_ANALYZER_AGGREGATE = `
SELECT
  normalized_query_hash,
  any(normalizedQueryHash(query)) as normalized_query,
  count() as execution_count,
  countIf(exception != '') as error_count,
  countIf(exception != '') / count() as error_rate,

  -- QUERY LATENCY METRICS (milliseconds)
  min(query_duration_ms) as min_duration_ms,
  max(query_duration_ms) as max_duration_ms,
  avg(query_duration_ms) as avg_duration_ms,
  quantile(0.50)(query_duration_ms) as p50_duration_ms,
  quantile(0.90)(query_duration_ms) as p90_duration_ms,
  quantile(0.95)(query_duration_ms) as p95_duration_ms,
  quantile(0.99)(query_duration_ms) as p99_duration_ms,
  sum(query_duration_ms) as total_duration_ms,

  -- MEMORY USAGE METRICS (bytes)
  min(memory_usage) as min_memory_bytes,
  max(memory_usage) as max_memory_bytes,
  avg(memory_usage) as avg_memory_bytes,
  quantile(0.50)(memory_usage) as p50_memory_bytes,
  quantile(0.90)(memory_usage) as p90_memory_bytes,
  quantile(0.95)(memory_usage) as p95_memory_bytes,
  quantile(0.99)(memory_usage) as p99_memory_bytes,
  sum(memory_usage) as total_memory_bytes,

  -- Peak memory usage
  min(peak_memory_usage) as min_peak_memory_bytes,
  max(peak_memory_usage) as max_peak_memory_bytes,
  avg(peak_memory_usage) as avg_peak_memory_bytes,
  quantile(0.50)(peak_memory_usage) as p50_peak_memory_bytes,
  quantile(0.90)(peak_memory_usage) as p90_peak_memory_bytes,
  quantile(0.95)(peak_memory_usage) as p95_peak_memory_bytes,
  quantile(0.99)(peak_memory_usage) as p99_peak_memory_bytes,

  -- CPU METRICS (seconds)
  min(ProfileEvents['UserTimeMicroseconds'] / 1000000) as min_cpu_user_seconds,
  max(ProfileEvents['UserTimeMicroseconds'] / 1000000) as max_cpu_user_seconds,
  avg(ProfileEvents['UserTimeMicroseconds'] / 1000000) as avg_cpu_user_seconds,
  quantile(0.50)(ProfileEvents['UserTimeMicroseconds'] / 1000000) as p50_cpu_user_seconds,
  quantile(0.90)(ProfileEvents['UserTimeMicroseconds'] / 1000000) as p90_cpu_user_seconds,
  quantile(0.95)(ProfileEvents['UserTimeMicroseconds'] / 1000000) as p95_cpu_user_seconds,
  quantile(0.99)(ProfileEvents['UserTimeMicroseconds'] / 1000000) as p99_cpu_user_seconds,
  sum(ProfileEvents['UserTimeMicroseconds'] / 1000000) as total_cpu_user_seconds,

  min(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as min_cpu_system_seconds,
  max(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as max_cpu_system_seconds,
  avg(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as avg_cpu_system_seconds,
  quantile(0.50)(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as p50_cpu_system_seconds,
  quantile(0.90)(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as p90_cpu_system_seconds,
  quantile(0.95)(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as p95_cpu_system_seconds,
  quantile(0.99)(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as p99_cpu_system_seconds,
  sum(ProfileEvents['SystemTimeMicroseconds'] / 1000000) as total_cpu_system_seconds,

  -- CPU WAIT TIME (I/O wait)
  min(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as min_cpu_wait_seconds,
  max(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as max_cpu_wait_seconds,
  avg(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as avg_cpu_wait_seconds,
  quantile(0.50)(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as p50_cpu_wait_seconds,
  quantile(0.90)(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as p90_cpu_wait_seconds,
  quantile(0.95)(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as p95_cpu_wait_seconds,
  quantile(0.99)(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as p99_cpu_wait_seconds,
  sum(ProfileEvents['OSCPUWaitMicroseconds'] / 1000000) as total_cpu_wait_seconds,

  -- ROWS PROCESSED
  min(read_rows) as min_read_rows,
  max(read_rows) as max_read_rows,
  avg(read_rows) as avg_read_rows,
  quantile(0.50)(read_rows) as p50_read_rows,
  quantile(0.90)(read_rows) as p90_read_rows,
  quantile(0.95)(read_rows) as p95_read_rows,
  quantile(0.99)(read_rows) as p99_read_rows,
  sum(read_rows) as total_read_rows,

  min(written_rows) as min_written_rows,
  max(written_rows) as max_written_rows,
  avg(written_rows) as avg_written_rows,
  quantile(0.50)(written_rows) as p50_written_rows,
  quantile(0.90)(written_rows) as p90_written_rows,
  quantile(0.95)(written_rows) as p95_written_rows,
  quantile(0.99)(written_rows) as p99_written_rows,
  sum(written_rows) as total_written_rows,

  min(result_rows) as min_result_rows,
  max(result_rows) as max_result_rows,
  avg(result_rows) as avg_result_rows,
  quantile(0.99)(result_rows) as p99_result_rows,

  -- I/O METRICS (bytes)
  min(read_bytes) as min_read_bytes,
  max(read_bytes) as max_read_bytes,
  avg(read_bytes) as avg_read_bytes,
  quantile(0.50)(read_bytes) as p50_read_bytes,
  quantile(0.90)(read_bytes) as p90_read_bytes,
  quantile(0.95)(read_bytes) as p95_read_bytes,
  quantile(0.99)(read_bytes) as p99_read_bytes,
  sum(read_bytes) as total_read_bytes,

  min(written_bytes) as min_written_bytes,
  max(written_bytes) as max_written_bytes,
  avg(written_bytes) as avg_written_bytes,
  quantile(0.50)(written_bytes) as p50_written_bytes,
  quantile(0.90)(written_bytes) as p90_written_bytes,
  quantile(0.95)(written_bytes) as p95_written_bytes,
  quantile(0.99)(written_bytes) as p99_written_bytes,
  sum(written_bytes) as total_written_bytes,

  min(ProfileEvents['OSReadBytes']) as min_os_read_bytes,
  max(ProfileEvents['OSReadBytes']) as max_os_read_bytes,
  avg(ProfileEvents['OSReadBytes']) as avg_os_read_bytes,
  quantile(0.50)(ProfileEvents['OSReadBytes']) as p50_os_read_bytes,
  quantile(0.90)(ProfileEvents['OSReadBytes']) as p90_os_read_bytes,
  quantile(0.95)(ProfileEvents['OSReadBytes']) as p95_os_read_bytes,
  quantile(0.99)(ProfileEvents['OSReadBytes']) as p99_os_read_bytes,

  min(ProfileEvents['OSWriteBytes']) as min_os_write_bytes,
  max(ProfileEvents['OSWriteBytes']) as max_os_write_bytes,
  avg(ProfileEvents['OSWriteBytes']) as avg_os_write_bytes,
  quantile(0.99)(ProfileEvents['OSWriteBytes']) as p99_os_write_bytes,

  -- NETWORK METRICS (bytes)
  min(ProfileEvents['NetworkSendBytes']) as min_network_send_bytes,
  max(ProfileEvents['NetworkSendBytes']) as max_network_send_bytes,
  avg(ProfileEvents['NetworkSendBytes']) as avg_network_send_bytes,
  quantile(0.50)(ProfileEvents['NetworkSendBytes']) as p50_network_send_bytes,
  quantile(0.90)(ProfileEvents['NetworkSendBytes']) as p90_network_send_bytes,
  quantile(0.95)(ProfileEvents['NetworkSendBytes']) as p95_network_send_bytes,
  quantile(0.99)(ProfileEvents['NetworkSendBytes']) as p99_network_send_bytes,
  sum(ProfileEvents['NetworkSendBytes']) as total_network_send_bytes,

  min(ProfileEvents['NetworkReceiveBytes']) as min_network_receive_bytes,
  max(ProfileEvents['NetworkReceiveBytes']) as max_network_receive_bytes,
  avg(ProfileEvents['NetworkReceiveBytes']) as avg_network_receive_bytes,
  quantile(0.99)(ProfileEvents['NetworkReceiveBytes']) as p99_network_receive_bytes,
  sum(ProfileEvents['NetworkReceiveBytes']) as total_network_receive_bytes,

  -- CACHE EFFICIENCY
  sum(ProfileEvents['DiskCacheHits']) as total_disk_cache_hits,
  sum(ProfileEvents['DiskCacheMisses']) as total_disk_cache_misses,
  if(total_disk_cache_hits + total_disk_cache_misses > 0,
     total_disk_cache_hits / (total_disk_cache_hits + total_disk_cache_misses),
     0) as disk_cache_hit_rate,

  sum(ProfileEvents['MarkCacheHits']) as total_mark_cache_hits,
  sum(ProfileEvents['MarkCacheMisses']) as total_mark_cache_misses,
  if(total_mark_cache_hits + total_mark_cache_misses > 0,
     total_mark_cache_hits / (total_mark_cache_hits + total_mark_cache_misses),
     0) as mark_cache_hit_rate,

  -- THREAD METRICS
  min(thread_ids) as min_thread_count,
  max(thread_ids) as max_thread_count,
  avg(thread_ids) as avg_thread_count,
  quantile(0.50)(thread_ids) as p50_thread_count,
  quantile(0.90)(thread_ids) as p90_thread_count,
  quantile(0.99)(thread_ids) as p99_thread_count,

  -- EFFICIENCY INDICATORS
  if(avg(query_duration_ms) > 0,
     avg(read_rows) / (avg(query_duration_ms) / 1000),
     0) as avg_rows_per_second,

  if(avg(query_duration_ms) > 0,
     avg(read_bytes) / (avg(query_duration_ms) / 1000),
     0) as avg_bytes_per_second,

  if(avg(ProfileEvents['UserTimeMicroseconds'] + ProfileEvents['SystemTimeMicroseconds'] + ProfileEvents['OSCPUWaitMicroseconds']) > 0,
     avg(ProfileEvents['OSCPUWaitMicroseconds']) / avg(ProfileEvents['UserTimeMicroseconds'] + ProfileEvents['SystemTimeMicroseconds'] + ProfileEvents['OSCPUWaitMicroseconds']),
     0) as io_wait_ratio,

  if(avg(read_rows) > 0,
     avg(memory_usage) / avg(read_rows),
     0) as avg_memory_per_row,

  if(avg(read_rows) > 0,
     avg(result_rows) / avg(read_rows),
     0) as result_efficiency,

  -- TABLE & QUERY INFO
  groupArray(5)(tables) as sample_tables,
  any(query_kind) as query_kind,

  -- TEMPORAL INFO
  min(event_time) as first_seen,
  max(event_time) as last_seen,

  -- ERROR TRACKING
  groupArray(3)(exception) as sample_exceptions

FROM {table}
WHERE event_date >= today() - INTERVAL {days} DAY
  AND type = 'QueryFinish'
  AND query NOT LIKE '%system.query_log%'
  AND is_initial_query = 1
  AND normalized_query_hash != 0
GROUP BY normalized_query_hash
HAVING execution_count >= {min_executions}
ORDER BY {sort_column} DESC
LIMIT {limit} OFFSET {offset}
`;

export const QUERY_DRILLDOWN = `
SELECT
  query_id,
  query,
  user,
  query_duration_ms,
  memory_usage,
  peak_memory_usage,
  read_rows,
  read_bytes,
  written_rows,
  written_bytes,
  result_rows,
  result_bytes,
  event_time,
  exception,

  ProfileEvents['UserTimeMicroseconds'] / 1000000 as cpu_user_seconds,
  ProfileEvents['SystemTimeMicroseconds'] / 1000000 as cpu_system_seconds,
  ProfileEvents['OSCPUWaitMicroseconds'] / 1000000 as cpu_wait_seconds,
  ProfileEvents['OSReadBytes'] as io_read_bytes,
  ProfileEvents['OSWriteBytes'] as io_write_bytes,
  ProfileEvents['NetworkSendBytes'] as network_send_bytes,
  ProfileEvents['NetworkReceiveBytes'] as network_receive_bytes,
  ProfileEvents['DiskCacheHits'] as disk_cache_hits,
  ProfileEvents['DiskCacheMisses'] as disk_cache_misses,

  tables

FROM {table}
WHERE normalized_query_hash = '{hash}'
  AND event_date >= today() - INTERVAL {days} DAY
  AND type = 'QueryFinish'
ORDER BY {sort_column} DESC
LIMIT {limit} OFFSET {offset}
`;

export const SLOW_QUERIES = `
SELECT
  query_id,
  normalizedQueryHash(query) as query_pattern,
  query,
  user,
  query_duration_ms,
  memory_usage,
  read_rows,
  read_bytes,
  event_time,
  exception,
  tables
FROM {table}
WHERE event_date >= today() - INTERVAL {days} DAY
  AND type = 'QueryFinish'
  AND query_duration_ms > {threshold_ms}
  AND query NOT LIKE '%system.query_log%'
ORDER BY query_duration_ms DESC
LIMIT {limit}
`;

// ============================================
// MATERIALIZED VIEWS
// ============================================

export const GET_MATERIALIZED_VIEWS = `
SELECT
  database,
  name,
  engine,
  total_rows,
  total_bytes,
  create_table_query,
  as_select as select_query,
  dependencies_database,
  dependencies_table
FROM system.tables
WHERE engine IN ('MaterializedView')
  AND database NOT IN ('system', 'information_schema')
ORDER BY database, name
`;

export const GET_TABLE_DEPENDENCIES = `
SELECT
  database,
  table,
  dependent_database,
  dependent_table
FROM system.dependencies
WHERE database = '{database}'
  OR dependent_database = '{database}'
ORDER BY database, table
`;

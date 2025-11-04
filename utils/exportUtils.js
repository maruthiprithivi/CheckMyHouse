/**
 * Export utilities for downloading data as CSV/JSON
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, headers = null) {
  if (!data || data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV header row
  const headerRow = csvHeaders.join(',');

  // Create data rows
  const dataRows = data.map((row) => {
    return csvHeaders
      .map((header) => {
        const value = row[header];
        // Handle nulls and undefined
        if (value === null || value === undefined) return '';
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data, filename, headers = null) {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Download blob as file
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Format query metrics for export
 */
export function formatQueryMetricsForExport(queries) {
  return queries.map((query) => ({
    query_hash: query.normalized_query_hash,
    normalized_query: query.normalized_query,
    execution_count: query.execution_count,
    error_count: query.error_count,
    error_rate: query.error_rate,

    // Duration metrics
    avg_duration_ms: query.avg_duration_ms,
    p50_duration_ms: query.p50_duration_ms,
    p90_duration_ms: query.p90_duration_ms,
    p95_duration_ms: query.p95_duration_ms,
    p99_duration_ms: query.p99_duration_ms,
    max_duration_ms: query.max_duration_ms,

    // Memory metrics
    avg_memory_bytes: query.avg_memory_bytes,
    p99_memory_bytes: query.p99_memory_bytes,
    max_memory_bytes: query.max_memory_bytes,

    // CPU metrics
    avg_cpu_user_seconds: query.avg_cpu_user_seconds,
    avg_cpu_wait_seconds: query.avg_cpu_wait_seconds,

    // I/O metrics
    total_read_rows: query.total_read_rows,
    total_read_bytes: query.total_read_bytes,

    // Efficiency
    disk_cache_hit_rate: query.disk_cache_hit_rate,
    result_efficiency: query.result_efficiency,
    io_wait_ratio: query.io_wait_ratio,

    first_seen: query.first_seen,
    last_seen: query.last_seen,
  }));
}

/**
 * Format table data for export
 */
export function formatTableDataForExport(tables) {
  return tables.map((table) => ({
    database: table.database,
    name: table.name,
    engine: table.engine,
    total_rows: table.total_rows,
    total_bytes: table.total_bytes,
    partition_key: table.partition_key,
    sorting_key: table.sorting_key,
    primary_key: table.primary_key,
  }));
}

/**
 * Format materialized views for export
 */
export function formatMaterializedViewsForExport(views) {
  return views.map((view) => ({
    database: view.database,
    name: view.name,
    engine: view.engine,
    total_rows: view.total_rows,
    total_bytes: view.total_bytes,
    source_tables: view.sources?.map(s => `${s.database}.${s.table}`).join('; ') || '',
    target_tables: view.targets?.map(t => `${t.database}.${t.table}`).join('; ') || '',
  }));
}

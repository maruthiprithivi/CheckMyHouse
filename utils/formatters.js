/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'N/A';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format milliseconds to human-readable format
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format ratio
 */
export function formatRatio(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals) + 'x';
}

/**
 * Format date
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(date);
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format SQL query (basic formatting)
 */
export function formatSQL(sql) {
  if (!sql) return '';

  return sql
    .replace(/\s+/g, ' ')
    .replace(/SELECT/gi, '\nSELECT')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/GROUP BY/gi, '\nGROUP BY')
    .replace(/ORDER BY/gi, '\nORDER BY')
    .replace(/LIMIT/gi, '\nLIMIT')
    .replace(/JOIN/gi, '\nJOIN')
    .trim();
}

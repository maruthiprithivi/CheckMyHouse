/**
 * ClickHouse Error Handling Utilities
 * Provides comprehensive error classification and user-friendly messages
 */

export class ClickHouseError extends Error {
  constructor(message, code, type, details = {}) {
    super(message);
    this.name = 'ClickHouseError';
    this.code = code;
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorTypes = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};

export const ErrorCodes = {
  ACCESS_DENIED: 497,
  QUOTA_EXCEEDED: 201,
  TIMEOUT_EXCEEDED: 159,
  TOO_MANY_SIMULTANEOUS_QUERIES: 202,
  UNKNOWN_TABLE: 60,
  UNKNOWN_DATABASE: 81,
  SYNTAX_ERROR: 62,
};

/**
 * Parse ClickHouse error and classify it
 */
export function parseClickHouseError(error) {
  const message = error.message || error.toString();
  const lowerMessage = message.toLowerCase();

  // Access/Permission errors
  if (
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('not enough privileges') ||
    error.code === ErrorCodes.ACCESS_DENIED
  ) {
    return new ClickHouseError(
      message,
      ErrorCodes.ACCESS_DENIED,
      ErrorTypes.PERMISSION_DENIED,
      {
        userFriendlyMessage: 'Insufficient permissions to access this resource',
        canRetry: false,
        requiresAction: true,
      }
    );
  }

  // Quota errors
  if (
    lowerMessage.includes('quota') ||
    lowerMessage.includes('has been exceeded') ||
    error.code === ErrorCodes.QUOTA_EXCEEDED
  ) {
    const quotaMatch = message.match(/(\w+)\s*=\s*(\d+)\/(\d+)/);
    const details = quotaMatch
      ? {
          metric: quotaMatch[1],
          current: parseInt(quotaMatch[2]),
          limit: parseInt(quotaMatch[3]),
        }
      : {};

    return new ClickHouseError(
      message,
      ErrorCodes.QUOTA_EXCEEDED,
      ErrorTypes.QUOTA_EXCEEDED,
      {
        userFriendlyMessage: 'Query quota exceeded. Please wait before retrying.',
        canRetry: true,
        retryAfter: 60,
        ...details,
      }
    );
  }

  // Timeout errors
  if (
    lowerMessage.includes('timeout') ||
    error.code === ErrorCodes.TIMEOUT_EXCEEDED
  ) {
    return new ClickHouseError(
      message,
      ErrorCodes.TIMEOUT_EXCEEDED,
      ErrorTypes.TIMEOUT,
      {
        userFriendlyMessage: 'Query execution timed out',
        canRetry: true,
      }
    );
  }

  // Connection errors
  if (
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('network')
  ) {
    return new ClickHouseError(
      message,
      'CONNECTION_ERROR',
      ErrorTypes.CONNECTION_ERROR,
      {
        userFriendlyMessage: 'Unable to connect to ClickHouse server',
        canRetry: true,
      }
    );
  }

  // Query syntax errors
  if (
    lowerMessage.includes('syntax error') ||
    error.code === ErrorCodes.SYNTAX_ERROR
  ) {
    return new ClickHouseError(
      message,
      ErrorCodes.SYNTAX_ERROR,
      ErrorTypes.QUERY_ERROR,
      {
        userFriendlyMessage: 'Invalid query syntax',
        canRetry: false,
      }
    );
  }

  // Unknown error
  return new ClickHouseError(
    message,
    'UNKNOWN',
    ErrorTypes.UNKNOWN,
    {
      userFriendlyMessage: 'An unexpected error occurred',
      canRetry: true,
    }
  );
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error) {
  const parsed = parseClickHouseError(error);
  return parsed.type === ErrorTypes.PERMISSION_DENIED;
}

/**
 * Check if error is a quota error
 */
export function isQuotaError(error) {
  const parsed = parseClickHouseError(error);
  return parsed.type === ErrorTypes.QUOTA_EXCEEDED;
}

/**
 * Check if error can be retried
 */
export function canRetryError(error) {
  const parsed = parseClickHouseError(error);
  return parsed.details.canRetry === true;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error) {
  const parsed = parseClickHouseError(error);
  return parsed.details.userFriendlyMessage || parsed.message;
}

/**
 * Get permission requirements for system tables
 */
export function getPermissionRequirements(systemTable) {
  const requirements = {
    'system.query_log': {
      grant: 'SELECT(event_date, event_time, query, normalized_query_hash, query_duration_ms, memory_usage, read_rows, read_bytes, written_rows, written_bytes, result_rows, result_bytes, exception, user, query_kind, tables, ProfileEvents, thread_ids, type, is_initial_query, peak_memory_usage)',
      feature: 'Query Analyzer',
      description: 'Analyze query performance and patterns',
      documentation: 'https://clickhouse.com/docs/en/operations/system-tables/query_log',
    },
    'system.clusters': {
      grant: 'SELECT(cluster, shard_num, replica_num, host_name, host_address, port)',
      feature: 'Cluster Detection',
      description: 'Detect cluster configuration and topology',
      documentation: 'https://clickhouse.com/docs/en/operations/system-tables/clusters',
    },
    'system.parts': {
      grant: 'SELECT(partition, name, rows, bytes_on_disk, data_compressed_bytes, data_uncompressed_bytes, marks, modification_time, min_date, max_date, level, primary_key_bytes_in_memory, database, table, active)',
      feature: 'Table Statistics',
      description: 'View table parts and storage details',
      documentation: 'https://clickhouse.com/docs/en/operations/system-tables/parts',
    },
    'system.tables': {
      grant: 'SELECT(database, name, engine, total_rows, total_bytes, metadata_modification_time, create_table_query)',
      feature: 'Table Explorer',
      description: 'Browse tables and metadata',
      documentation: 'https://clickhouse.com/docs/en/operations/system-tables/tables',
    },
  };

  return requirements[systemTable] || null;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error, includeDetails = false) {
  const parsed = parseClickHouseError(error);

  const response = {
    error: parsed.details.userFriendlyMessage || parsed.message,
    type: parsed.type,
    code: parsed.code,
    timestamp: parsed.timestamp,
  };

  if (includeDetails) {
    response.details = parsed.details;
    response.originalMessage = parsed.message;
  }

  if (parsed.type === ErrorTypes.PERMISSION_DENIED) {
    const table = extractSystemTable(parsed.message);
    const requirements = getPermissionRequirements(table);
    if (requirements) {
      response.requirements = requirements;
    }
  }

  if (parsed.type === ErrorTypes.QUOTA_EXCEEDED) {
    response.retryAfter = parsed.details.retryAfter || 60;
    if (parsed.details.metric) {
      response.quotaInfo = {
        metric: parsed.details.metric,
        current: parsed.details.current,
        limit: parsed.details.limit,
      };
    }
  }

  return response;
}

/**
 * Extract system table name from error message
 */
function extractSystemTable(message) {
  const match = message.match(/system\.(\w+)/);
  return match ? `system.${match[1]}` : null;
}

/**
 * Create permission error response
 */
export function createPermissionErrorResponse(table, feature) {
  const requirements = getPermissionRequirements(table);
  return {
    error: `Insufficient permissions to access ${table}`,
    type: ErrorTypes.PERMISSION_DENIED,
    feature,
    disabled: true,
    requirements: requirements || {
      table,
      feature,
      description: `Access to ${table} is required for this feature`,
    },
  };
}

/**
 * Create quota exceeded response
 */
export function createQuotaExceededResponse(quotaInfo = {}) {
  return {
    error: 'Query quota exceeded',
    type: ErrorTypes.QUOTA_EXCEEDED,
    retryAfter: 60,
    quotaInfo,
    message: 'You have exceeded your query quota. Please wait before retrying or contact your administrator to increase limits.',
  };
}

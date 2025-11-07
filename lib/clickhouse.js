import { createClient } from '@clickhouse/client';
import { cookies } from 'next/headers';
import {
  parseClickHouseError,
  isPermissionError,
  isQuotaError,
  ErrorTypes,
  createPermissionErrorResponse,
} from './errors';
import globalCache, { CacheTTL } from './cache';
import { escapeIdentifier, validateTableIdentifier } from './validation';

let clickhouseClient = null;
let currentConfig = null;
let systemCapabilities = null;

/**
 * Get connection config from cookies
 */
export async function getConfigFromCookies() {
  try {
    const cookieStore = await cookies();
    const configCookie = cookieStore.get('clickhouse_config');

    if (!configCookie) {
      return null;
    }

    return JSON.parse(decodeURIComponent(configCookie.value));
  } catch (error) {
    console.error('Error reading config from cookies:', error);
    return null;
  }
}

/**
 * Get or initialize ClickHouse client from request cookies
 */
export async function getClientFromRequest() {
  // Try to get existing client
  if (clickhouseClient) {
    return clickhouseClient;
  }

  // Try to initialize from cookies
  const config = await getConfigFromCookies();
  if (config) {
    return initClickHouseClient(config);
  }

  throw new Error('ClickHouse client not initialized. Please connect first.');
}

/**
 * Initialize ClickHouse client
 */
export function initClickHouseClient(config) {
  currentConfig = config;
  systemCapabilities = null; // Clear capabilities on reconnect

  clickhouseClient = createClient({
    url: config.url || config.host || 'http://localhost:8123',
    username: config.username || 'default',
    password: config.password || '',
    database: config.database || 'default',
    clickhouse_settings: {
      max_execution_time: 300,
      max_memory_usage: 10000000000,
    },
    request_timeout: 300000,
  });

  return clickhouseClient;
}

/**
 * Get existing ClickHouse client, or initialize from config if provided
 */
export function getClickHouseClient(config = null) {
  // If config is provided, reinitialize
  if (config) {
    return initClickHouseClient(config);
  }

  // If client exists, return it
  if (clickhouseClient) {
    return clickhouseClient;
  }

  // If we have a stored config, reinitialize
  if (currentConfig) {
    return initClickHouseClient(currentConfig);
  }

  throw new Error('ClickHouse client not initialized. Call initClickHouseClient first.');
}

/**
 * Test connection to ClickHouse
 */
export async function testConnection(config) {
  try {
    const client = createClient({
      url: config.url || config.host,
      username: config.username,
      password: config.password,
      database: config.database || 'default',
    });

    const result = await client.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow',
    });

    await result.json();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Detect cluster configuration with permission handling
 */
export async function detectClusterConfig(client) {
  // Check cache first
  const cacheKey = 'cluster_config';
  const cached = globalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const result = await client.query({
      query: `
        SELECT
          cluster,
          shard_num,
          replica_num,
          host_name,
          host_address,
          port
        FROM system.clusters
        ORDER BY cluster, shard_num, replica_num
      `,
      format: 'JSONEachRow',
    });

    const clusters = await result.json();

    // If we got results, it's OSS (not Cloud)
    let config;
    if (clusters.length > 0) {
      const uniqueClusters = [...new Set(clusters.map(c => c.cluster))];
      const hasSharding = clusters.some(c => c.shard_num > 1);
      const hasReplicas = clusters.filter(c => c.cluster === uniqueClusters[0]).length > 1;

      config = {
        isClustered: true,
        isCloud: false,
        clusters: uniqueClusters,
        defaultCluster: uniqueClusters[0] || null,
        hasSharding,
        hasReplicas,
        nodes: clusters,
        hasSystemClustersAccess: true,
      };
    } else {
      config = {
        isClustered: false,
        isCloud: false,
        clusters: [],
        defaultCluster: null,
        hasSharding: false,
        hasReplicas: false,
        nodes: [],
        hasSystemClustersAccess: true,
      };
    }

    // Cache the result
    globalCache.set(cacheKey, config, CacheTTL.CLUSTER_CONFIG);
    return config;
  } catch (error) {
    const parsedError = parseClickHouseError(error);

    // If permission denied, assume single-node and cache the result
    if (parsedError.type === ErrorTypes.PERMISSION_DENIED) {
      console.log('system.clusters not accessible (permission denied) - assuming single node');
      const config = {
        isClustered: false,
        isCloud: true,
        clusters: [],
        defaultCluster: null,
        hasSharding: false,
        hasReplicas: false,
        nodes: [],
        hasSystemClustersAccess: false,
        permissionError: true,
      };
      globalCache.set(cacheKey, config, CacheTTL.CLUSTER_CONFIG);
      return config;
    }

    // Other errors - return safe defaults without caching
    console.error('Error detecting cluster config:', parsedError.message);
    return {
      isClustered: false,
      isCloud: true,
      clusters: [],
      defaultCluster: null,
      hasSharding: false,
      hasReplicas: false,
      nodes: [],
      hasSystemClustersAccess: false,
      error: parsedError.message,
    };
  }
}

/**
 * Build cluster-aware query
 */
export function buildClusterQuery(baseQuery, table, clusterConfig) {
  if (!clusterConfig.isClustered || !clusterConfig.defaultCluster) {
    // Single node or ClickHouse Cloud
    return baseQuery.replace('{table}', table);
  }

  // ClickHouse OSS with cluster - use clusterAllReplicas
  // Escape cluster name to prevent injection
  const escapedCluster = escapeIdentifier(clusterConfig.defaultCluster);
  const clusterFunc = `clusterAllReplicas('${escapedCluster}', ${table})`;
  return baseQuery.replace('{table}', clusterFunc);
}

/**
 * Execute query with automatic retries and error handling
 */
export async function executeQuery(client, query, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  const skipRetryOnPermission = options.skipRetryOnPermission !== false;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await client.query({
        query,
        format: options.format || 'JSONEachRow',
        clickhouse_settings: options.settings || {},
      });

      return await result.json();
    } catch (error) {
      const parsedError = parseClickHouseError(error);

      // Don't retry permission errors
      if (skipRetryOnPermission && parsedError.type === ErrorTypes.PERMISSION_DENIED) {
        throw parsedError;
      }

      // Don't retry quota errors immediately
      if (parsedError.type === ErrorTypes.QUOTA_EXCEEDED) {
        throw parsedError;
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw parsedError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
}

/**
 * Execute query with permission check
 * Returns { success, data, error, permissionDenied }
 */
export async function executeQuerySafe(client, query, options = {}) {
  try {
    const data = await executeQuery(client, query, options);
    return {
      success: true,
      data,
      error: null,
      permissionDenied: false,
    };
  } catch (error) {
    const parsedError = parseClickHouseError(error);
    return {
      success: false,
      data: null,
      error: parsedError,
      permissionDenied: parsedError.type === ErrorTypes.PERMISSION_DENIED,
      quotaExceeded: parsedError.type === ErrorTypes.QUOTA_EXCEEDED,
    };
  }
}

/**
 * Detect system capabilities (what features are available)
 */
export async function detectSystemCapabilities(client) {
  // Return cached capabilities if available
  if (systemCapabilities) {
    return systemCapabilities;
  }

  const capabilities = {
    hasQueryLog: false,
    hasClusters: false,
    hasParts: false,
    hasProcesses: false,
    checkedAt: new Date().toISOString(),
  };

  // Test system.query_log access
  const queryLogResult = await executeQuerySafe(
    client,
    'SELECT 1 FROM system.query_log LIMIT 1',
    { maxRetries: 1 }
  );
  capabilities.hasQueryLog = queryLogResult.success;

  // Test system.clusters access
  const clustersResult = await executeQuerySafe(
    client,
    'SELECT 1 FROM system.clusters LIMIT 1',
    { maxRetries: 1 }
  );
  capabilities.hasClusters = clustersResult.success;

  // Test system.parts access
  const partsResult = await executeQuerySafe(
    client,
    'SELECT 1 FROM system.parts LIMIT 1',
    { maxRetries: 1 }
  );
  capabilities.hasParts = partsResult.success;

  // Test system.processes access
  const processesResult = await executeQuerySafe(
    client,
    'SELECT 1 FROM system.processes LIMIT 1',
    { maxRetries: 1 }
  );
  capabilities.hasProcesses = processesResult.success;

  // Cache capabilities
  systemCapabilities = capabilities;
  return capabilities;
}

/**
 * Get cached capabilities or detect them
 */
export async function getSystemCapabilities(client) {
  if (!systemCapabilities) {
    await detectSystemCapabilities(client);
  }
  return systemCapabilities;
}

/**
 * Clear capabilities cache (call when connection changes)
 */
export function clearCapabilitiesCache() {
  systemCapabilities = null;
}

/**
 * Get ClickHouse version
 */
let cachedVersion = null;

export async function getClickHouseVersion(client) {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const result = await client.query({
      query: 'SELECT version() as version',
      format: 'JSONEachRow',
    });

    const data = await result.json();
    const versionString = data[0]?.version || '0.0.0';

    const versionMatch = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
      cachedVersion = {
        full: versionString,
        major: parseInt(versionMatch[1], 10),
        minor: parseInt(versionMatch[2], 10),
        patch: parseInt(versionMatch[3], 10),
      };
    } else {
      cachedVersion = {
        full: versionString,
        major: 24,
        minor: 0,
        patch: 0,
      };
    }

    return cachedVersion;
  } catch (error) {
    console.error('Error detecting ClickHouse version:', error);
    cachedVersion = {
      full: 'unknown',
      major: 19,
      minor: 0,
      patch: 0,
    };
    return cachedVersion;
  }
}

/**
 * Check if a table/column exists
 */
export async function checkTableExists(client, database, table) {
  try {
    // Validate and escape identifiers
    const validated = validateTableIdentifier(database, table);
    if (!validated.success) {
      console.error('Invalid table identifier:', validated.error);
      return false;
    }

    const result = await client.query({
      query: `SELECT 1 FROM system.tables WHERE database = '${validated.database}' AND name = '${validated.table}' LIMIT 1`,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    return data.length > 0;
  } catch (error) {
    return false;
  }
}

export async function checkColumnExists(client, database, table, column) {
  try {
    // Validate and escape identifiers
    const validated = validateTableIdentifier(database, table);
    if (!validated.success) {
      console.error('Invalid table identifier:', validated.error);
      return false;
    }
    const escapedColumn = escapeIdentifier(column);

    const result = await client.query({
      query: `SELECT 1 FROM system.columns WHERE database = '${validated.database}' AND table = '${validated.table}' AND name = '${escapedColumn}' LIMIT 1`,
      format: 'JSONEachRow',
    });
    const data = await result.json();
    return data.length > 0;
  } catch (error) {
    return false;
  }
}

import { createClient } from '@clickhouse/client';
import { cookies } from 'next/headers';

let clickhouseClient = null;
let currentConfig = null;

/**
 * Get connection config from cookies
 */
export function getConfigFromCookies() {
  try {
    const cookieStore = cookies();
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
export function getClientFromRequest() {
  // Try to get existing client
  if (clickhouseClient) {
    return clickhouseClient;
  }

  // Try to initialize from cookies
  const config = getConfigFromCookies();
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
 * Detect cluster configuration
 */
export async function detectClusterConfig(client) {
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
    if (clusters.length > 0) {
      const uniqueClusters = [...new Set(clusters.map(c => c.cluster))];
      const hasSharding = clusters.some(c => c.shard_num > 1);
      const hasReplicas = clusters.filter(c => c.cluster === uniqueClusters[0]).length > 1;

      return {
        isClustered: true,
        isCloud: false, // OSS with accessible system.clusters
        clusters: uniqueClusters,
        defaultCluster: uniqueClusters[0] || null,
        hasSharding,
        hasReplicas,
        nodes: clusters,
      };
    }

    // Empty result - single node OSS or restricted access
    return {
      isClustered: false,
      isCloud: false, // Could be single-node OSS
      clusters: [],
      defaultCluster: null,
      hasSharding: false,
      hasReplicas: false,
      nodes: [],
    };
  } catch (error) {
    // If system.clusters is not accessible, likely Cloud or restricted OSS
    console.log('Unable to detect cluster config:', error.message);
    return {
      isClustered: false,
      isCloud: true, // Assume Cloud if system.clusters not accessible
      clusters: [],
      defaultCluster: null,
      hasSharding: false,
      hasReplicas: false,
      nodes: [],
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
  const clusterFunc = `clusterAllReplicas('${clusterConfig.defaultCluster}', ${table})`;
  return baseQuery.replace('{table}', clusterFunc);
}

/**
 * Execute query with automatic retries
 */
export async function executeQuery(client, query, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await client.query({
        query,
        format: options.format || 'JSONEachRow',
        clickhouse_settings: options.settings || {},
      });

      return await result.json();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
}

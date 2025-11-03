import { createClient } from '@clickhouse/client';

let clickhouseClient = null;

/**
 * Initialize ClickHouse client
 */
export function initClickHouseClient(config) {
  clickhouseClient = createClient({
    host: config.host || 'http://localhost:8123',
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
 * Get existing ClickHouse client
 */
export function getClickHouseClient() {
  if (!clickhouseClient) {
    throw new Error('ClickHouse client not initialized. Call initClickHouseClient first.');
  }
  return clickhouseClient;
}

/**
 * Test connection to ClickHouse
 */
export async function testConnection(config) {
  try {
    const client = createClient({
      host: config.host,
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

    const uniqueClusters = [...new Set(clusters.map(c => c.cluster))];
    const hasSharding = clusters.some(c => c.shard_num > 1);
    const hasReplicas = clusters.filter(c => c.cluster === uniqueClusters[0]).length > 1;

    return {
      isClustered: clusters.length > 0,
      isCloud: clusters.length === 0, // ClickHouse Cloud doesn't expose system.clusters
      clusters: uniqueClusters,
      defaultCluster: uniqueClusters[0] || null,
      hasSharding,
      hasReplicas,
      nodes: clusters,
    };
  } catch (error) {
    // If system.clusters is not accessible, assume single node or Cloud
    console.log('Unable to detect cluster config:', error.message);
    return {
      isClustered: false,
      isCloud: true,
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

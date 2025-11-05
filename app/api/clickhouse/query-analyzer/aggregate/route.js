import { NextResponse } from 'next/server';
import {
  getClientFromRequest,
  detectClusterConfig,
  buildClusterQuery,
  executeQuerySafe,
  getSystemCapabilities,
} from '@/lib/clickhouse';
import { QUERY_ANALYZER_AGGREGATE } from '@/lib/queries';
import { formatErrorResponse, createPermissionErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const sortColumn = searchParams.get('sort_column') || 'p99_duration_ms';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 500);
    const offset = parseInt(searchParams.get('offset')) || 0;
    const minExecutions = parseInt(searchParams.get('min_executions')) || 5;

    const client = await getClientFromRequest();

    // Check system capabilities
    const capabilities = await getSystemCapabilities(client);
    if (!capabilities.hasQueryLog) {
      return NextResponse.json(
        createPermissionErrorResponse('system.query_log', 'Query Analyzer'),
        { status: 403 }
      );
    }

    // Generate cache key
    const cacheKey = globalCache.generateKey('query_analyzer', {
      days,
      sortColumn,
      limit,
      offset,
      minExecutions,
    });

    // Check cache
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Detect cluster configuration
    const clusterConfig = await detectClusterConfig(client);

    // Build cluster-aware query
    const query = buildClusterQuery(
      QUERY_ANALYZER_AGGREGATE,
      'system.query_log',
      clusterConfig
    )
      .replace('{days}', days)
      .replace('{sort_column}', sortColumn)
      .replace('{limit}', limit)
      .replace('{offset}', offset)
      .replace('{min_executions}', minExecutions);

    // Execute query with error handling
    const result = await executeQuerySafe(client, query);

    if (!result.success) {
      if (result.permissionDenied) {
        return NextResponse.json(
          createPermissionErrorResponse('system.query_log', 'Query Analyzer'),
          { status: 403 }
        );
      }

      if (result.quotaExceeded) {
        return NextResponse.json(
          formatErrorResponse(result.error, true),
          { status: 429 }
        );
      }

      return NextResponse.json(
        formatErrorResponse(result.error, false),
        { status: 500 }
      );
    }

    const responseData = {
      queries: result.data,
      total: result.data.length,
      cluster: clusterConfig,
      params: {
        days,
        sortColumn,
        limit,
        offset,
        minExecutions,
      },
    };

    // Cache the response
    globalCache.set(cacheKey, responseData, CacheTTL.QUERY_ANALYZER);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching query analyzer data:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}

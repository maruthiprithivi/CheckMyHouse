import { NextResponse } from 'next/server';
import {
  getClientFromRequest,
  detectClusterConfig,
  buildClusterQuery,
  executeQuerySafe,
  getSystemCapabilities,
} from '@/lib/clickhouse';
import { SLOW_QUERIES } from '@/lib/queries';
import { formatErrorResponse, createPermissionErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const thresholdMs = parseInt(searchParams.get('threshold_ms')) || 1000;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 500);

    const client = await getClientFromRequest();

    // Check system capabilities
    const capabilities = await getSystemCapabilities(client);
    if (!capabilities.hasQueryLog) {
      return NextResponse.json(
        createPermissionErrorResponse('system.query_log', 'Slow Queries'),
        { status: 403 }
      );
    }

    // Generate cache key
    const cacheKey = globalCache.generateKey('slow_queries', {
      days,
      thresholdMs,
      limit,
    });

    // Check cache
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    const clusterConfig = await detectClusterConfig(client);

    const query = buildClusterQuery(
      SLOW_QUERIES,
      'system.query_log',
      clusterConfig
    )
      .replace('{days}', days)
      .replace('{threshold_ms}', thresholdMs)
      .replace('{limit}', limit);

    // Execute query with error handling
    const result = await executeQuerySafe(client, query);

    if (!result.success) {
      if (result.permissionDenied) {
        return NextResponse.json(
          createPermissionErrorResponse('system.query_log', 'Slow Queries'),
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
      thresholdMs,
    };

    // Cache the response
    globalCache.set(cacheKey, responseData, CacheTTL.SLOW_QUERIES);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}

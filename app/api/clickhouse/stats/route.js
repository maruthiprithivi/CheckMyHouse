import { NextResponse } from 'next/server';
import {
  getClientFromRequest,
  executeQuerySafe,
  getSystemCapabilities,
} from '@/lib/clickhouse';
import { formatErrorResponse, createPermissionErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    const table = searchParams.get('table');

    if (!database || !table) {
      return NextResponse.json(
        { error: 'Database and table parameters are required' },
        { status: 400 }
      );
    }

    const client = await getClientFromRequest();

    // Check system capabilities
    const capabilities = await getSystemCapabilities(client);
    if (!capabilities.hasParts) {
      return NextResponse.json(
        createPermissionErrorResponse('system.parts', 'Table Statistics'),
        { status: 403 }
      );
    }

    // Generate cache key
    const cacheKey = globalCache.generateKey('table_stats', {
      database,
      table,
    });

    // Check cache
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Get table statistics
    const statsQuery = `
      SELECT
        sum(rows) as total_rows,
        sum(bytes_on_disk) as total_bytes_on_disk,
        sum(data_compressed_bytes) as total_compressed_bytes,
        sum(data_uncompressed_bytes) as total_uncompressed_bytes,
        count() as total_parts,
        count(DISTINCT partition) as total_partitions,
        max(modification_time) as last_modified,
        min(min_date) as min_date,
        max(max_date) as max_date
      FROM system.parts
      WHERE database = '${database}'
        AND table = '${table}'
        AND active = 1
    `;

    const result = await executeQuerySafe(client, statsQuery);

    if (!result.success) {
      if (result.permissionDenied) {
        return NextResponse.json(
          createPermissionErrorResponse('system.parts', 'Table Statistics'),
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
      stats: result.data[0] || {},
    };

    // Cache the response
    globalCache.set(cacheKey, responseData, CacheTTL.TABLE_STATS);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching table stats:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}

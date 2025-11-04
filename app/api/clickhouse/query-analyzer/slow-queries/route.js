import { NextResponse } from 'next/server';
import { getClientFromRequest, detectClusterConfig, buildClusterQuery } from '@/lib/clickhouse';
import { SLOW_QUERIES } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const thresholdMs = parseInt(searchParams.get('threshold_ms')) || 1000;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 500);

    const client = getClientFromRequest();
    const clusterConfig = await detectClusterConfig(client);

    const query = buildClusterQuery(
      SLOW_QUERIES,
      'system.query_log',
      clusterConfig
    )
      .replace('{days}', days)
      .replace('{threshold_ms}', thresholdMs)
      .replace('{limit}', limit);

    const result = await client.query({
      query,
      format: 'JSONEachRow',
    });

    const slowQueries = await result.json();

    return NextResponse.json({
      queries: slowQueries,
      total: slowQueries.length,
      thresholdMs,
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch slow queries' },
      { status: 500 }
    );
  }
}

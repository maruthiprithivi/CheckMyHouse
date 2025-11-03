import { NextResponse } from 'next/server';
import { getClickHouseClient, detectClusterConfig, buildClusterQuery } from '@/lib/clickhouse';
import { QUERY_ANALYZER_AGGREGATE } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const sortColumn = searchParams.get('sort_column') || 'p99_duration_ms';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 500);
    const offset = parseInt(searchParams.get('offset')) || 0;
    const minExecutions = parseInt(searchParams.get('min_executions')) || 5;

    const client = getClickHouseClient();

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

    const result = await client.query({
      query,
      format: 'JSONEachRow',
    });

    const queries = await result.json();

    return NextResponse.json({
      queries,
      total: queries.length,
      cluster: clusterConfig,
      params: {
        days,
        sortColumn,
        limit,
        offset,
        minExecutions,
      },
    });
  } catch (error) {
    console.error('Error fetching query analyzer data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch query analyzer data' },
      { status: 500 }
    );
  }
}

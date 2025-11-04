import { NextResponse } from 'next/server';
import { getClientFromRequest, detectClusterConfig, buildClusterQuery } from '@/lib/clickhouse';
import { QUERY_DRILLDOWN } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    const days = parseInt(searchParams.get('days')) || 7;
    const sortColumn = searchParams.get('sort_column') || 'query_duration_ms';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 1000);
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!hash) {
      return NextResponse.json(
        { error: 'Hash parameter is required' },
        { status: 400 }
      );
    }

    const client = getClientFromRequest();
    const clusterConfig = await detectClusterConfig(client);

    const query = buildClusterQuery(
      QUERY_DRILLDOWN,
      'system.query_log',
      clusterConfig
    )
      .replace('{hash}', hash)
      .replace('{days}', days)
      .replace('{sort_column}', sortColumn)
      .replace('{limit}', limit)
      .replace('{offset}', offset);

    const result = await client.query({
      query,
      format: 'JSONEachRow',
    });

    const executions = await result.json();

    return NextResponse.json({
      executions,
      total: executions.length,
      hash,
    });
  } catch (error) {
    console.error('Error fetching query drilldown:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch query drilldown' },
      { status: 500 }
    );
  }
}

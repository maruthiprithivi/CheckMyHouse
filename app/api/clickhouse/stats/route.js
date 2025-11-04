import { NextResponse } from 'next/server';
import { getClientFromRequest } from '@/lib/clickhouse';

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

    const statsResult = await client.query({
      query: statsQuery,
      format: 'JSONEachRow',
    });

    const stats = await statsResult.json();

    return NextResponse.json({
      stats: stats[0] || {},
    });
  } catch (error) {
    console.error('Error fetching table stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch table stats' },
      { status: 500 }
    );
  }
}

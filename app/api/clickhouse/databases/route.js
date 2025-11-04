import { NextResponse } from 'next/server';
import { getClientFromRequest } from '@/lib/clickhouse';
import { GET_DATABASES } from '@/lib/queries';

export async function GET(request) {
  try {
    const client = await getClientFromRequest();

    const result = await client.query({
      query: GET_DATABASES,
      format: 'JSONEachRow',
    });

    const databases = await result.json();

    // Get table counts for each database
    const databasesWithCounts = await Promise.all(
      databases.map(async (db) => {
        try {
          const countResult = await client.query({
            query: `SELECT count() as table_count FROM system.tables WHERE database = '${db.name}'`,
            format: 'JSONEachRow',
          });
          const countData = await countResult.json();

          return {
            ...db,
            table_count: countData[0]?.table_count || 0,
          };
        } catch (error) {
          return {
            ...db,
            table_count: 0,
          };
        }
      })
    );

    return NextResponse.json({
      databases: databasesWithCounts,
      total: databasesWithCounts.length,
    });
  } catch (error) {
    console.error('Error fetching databases:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}

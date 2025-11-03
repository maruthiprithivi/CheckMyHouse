import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';
import { GET_TABLES, GET_TABLE_COLUMNS, GET_TABLE_PARTS } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    const table = searchParams.get('table');
    const details = searchParams.get('details') === 'true';

    if (!database) {
      return NextResponse.json(
        { error: 'Database parameter is required' },
        { status: 400 }
      );
    }

    const client = getClickHouseClient();

    // If specific table requested with details
    if (table && details) {
      const [columnsResult, partsResult] = await Promise.all([
        client.query({
          query: GET_TABLE_COLUMNS.replace('{database}', database).replace('{table}', table),
          format: 'JSONEachRow',
        }),
        client.query({
          query: GET_TABLE_PARTS.replace('{database}', database).replace('{table}', table),
          format: 'JSONEachRow',
        }).catch(() => null), // Parts may not be available for all table types
      ]);

      const columns = await columnsResult.json();
      const parts = partsResult ? await partsResult.json() : [];

      return NextResponse.json({
        columns,
        parts,
        partCount: parts.length,
      });
    }

    // Get all tables for database
    const result = await client.query({
      query: GET_TABLES.replace('{database}', database),
      format: 'JSONEachRow',
    });

    const tables = await result.json();

    return NextResponse.json({
      tables,
      total: tables.length,
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

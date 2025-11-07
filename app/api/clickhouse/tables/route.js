import { NextResponse } from 'next/server';
import { getClientFromRequest, getClickHouseVersion, checkColumnExists } from '@/lib/clickhouse';
import { GET_TABLES, GET_TABLE_COLUMNS, GET_TABLE_COLUMNS_WITH_CODEC, GET_TABLE_PARTS } from '@/lib/queries';

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

    const client = await getClientFromRequest();

    // If specific table requested with details
    if (table && details) {
      // Check version and codec_expression column availability
      let columnsQuery = GET_TABLE_COLUMNS;

      try {
        const version = await getClickHouseVersion(client);
        const hasCodecColumn = await checkColumnExists(client, 'system', 'columns', 'codec_expression');

        // Use extended query with codec_expression if available (ClickHouse 20.1+)
        if ((version.major >= 20 && version.minor >= 1) || hasCodecColumn) {
          columnsQuery = GET_TABLE_COLUMNS_WITH_CODEC;
        }
      } catch (error) {
        console.log('Version detection failed, using basic columns query:', error.message);
        // Fall back to basic query without codec_expression
      }

      const [columnsResult, partsResult] = await Promise.all([
        client.query({
          query: columnsQuery.replace('{database}', database).replace('{table}', table),
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

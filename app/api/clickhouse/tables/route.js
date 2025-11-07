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
      // Always start with basic query for maximum compatibility
      let columnsQuery = GET_TABLE_COLUMNS;

      try {
        // Check if codec_expression column exists before using extended query
        const hasCodecColumn = await checkColumnExists(client, 'system', 'columns', 'codec_expression');

        // Only use extended query if codec_expression definitely exists
        if (hasCodecColumn === true) {
          console.log('codec_expression available, using extended query');
          columnsQuery = GET_TABLE_COLUMNS_WITH_CODEC;
        } else {
          console.log('codec_expression not available, using basic query');
        }
      } catch (error) {
        console.log('Column check failed, using basic query:', error.message);
        // Always fall back to basic query without codec_expression
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

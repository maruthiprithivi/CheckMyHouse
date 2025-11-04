import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';
import { GET_MATERIALIZED_VIEWS, GET_TABLE_DEPENDENCIES } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');

    const client = getClickHouseClient();

    // Get all materialized views
    const mvResult = await client.query({
      query: GET_MATERIALIZED_VIEWS,
      format: 'JSONEachRow',
    });

    let views = await mvResult.json();

    // Filter by database if specified
    if (database) {
      views = views.filter(v => v.database === database);
    }

    // Get dependencies for each view
    const viewsWithDeps = await Promise.all(
      views.map(async (view) => {
        try {
          const depsResult = await client.query({
            query: GET_TABLE_DEPENDENCIES.replace('{database}', view.database),
            format: 'JSONEachRow',
          });

          const deps = await depsResult.json();

          // Find dependencies for this specific view
          const sourceTables = deps
            .filter(d => d.dependent_database === view.database && d.dependent_table === view.name)
            .map(d => ({ database: d.database, table: d.table }));

          const targetTables = deps
            .filter(d => d.database === view.database && d.table === view.name)
            .map(d => ({ database: d.dependent_database, table: d.dependent_table }));

          return {
            ...view,
            sources: sourceTables,
            targets: targetTables,
          };
        } catch (error) {
          return {
            ...view,
            sources: [],
            targets: [],
          };
        }
      })
    );

    return NextResponse.json({
      views: viewsWithDeps,
      total: viewsWithDeps.length,
    });
  } catch (error) {
    console.error('Error fetching materialized views:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch materialized views' },
      { status: 500 }
    );
  }
}

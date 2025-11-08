import { NextResponse } from 'next/server';
import { getClientFromRequest, checkTableExists } from '@/lib/clickhouse';
import { GET_MATERIALIZED_VIEWS, GET_TABLE_DEPENDENCIES, GET_DEPENDENCIES_FROM_VIEWS } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');

    const client = await getClientFromRequest();

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

    // Check if system.dependencies table exists (added in ClickHouse 20.3+)
    const hasDependenciesTable = await checkTableExists(client, 'system', 'dependencies');

    // Get dependencies for each view
    const viewsWithDeps = await Promise.all(
      views.map(async (view) => {
        try {
          let sourceTables = [];
          let targetTables = [];

          if (hasDependenciesTable) {
            // Use system.dependencies for newer ClickHouse versions
            try {
              const depsResult = await client.query({
                query: GET_TABLE_DEPENDENCIES.replace('{database}', view.database),
                format: 'JSONEachRow',
              });

              const deps = await depsResult.json();

              // Find dependencies for this specific view
              sourceTables = deps
                .filter(d => d.dependent_database === view.database && d.dependent_table === view.name)
                .map(d => ({ database: d.database, table: d.table }));

              targetTables = deps
                .filter(d => d.database === view.database && d.table === view.name)
                .map(d => ({ database: d.dependent_database, table: d.dependent_table }));
            } catch (error) {
              console.log('Failed to query system.dependencies for view, using fallback:', error.message);
            }
          }

          // Fallback 1: Extract from view metadata (dependencies_database, dependencies_table)
          if (sourceTables.length === 0 && view.dependencies_database && view.dependencies_table) {
            // These can be arrays if multiple dependencies exist
            const depDatabases = Array.isArray(view.dependencies_database)
              ? view.dependencies_database
              : [view.dependencies_database];
            const depTables = Array.isArray(view.dependencies_table)
              ? view.dependencies_table
              : [view.dependencies_table];

            sourceTables = depDatabases.map((db, i) => ({
              database: db || view.database,
              table: depTables[i] || '',
            })).filter(d => d.table);
          }

          // Fallback 2: Parse FROM clause in the CREATE statement
          if (sourceTables.length === 0 && view.create_table_query) {
            const fromMatch = view.create_table_query.match(/FROM\s+(?:([`\w]+)\.)?([`\w]+)/i);
            if (fromMatch) {
              const db = fromMatch[1] ? fromMatch[1].replace(/[`]/g, '') : view.database;
              const tbl = fromMatch[2].replace(/[`]/g, '');
              if (tbl) {
                sourceTables = [{ database: db, table: tbl }];
              }
            }
          }

          // Fallback 3: Parse TO <db>.<table> in CREATE MATERIALIZED VIEW to detect targets
          if (targetTables.length === 0 && view.create_table_query) {
            const toMatch = view.create_table_query.match(/\bTO\s+(?:([`\w]+)\.)?([`\w]+)/i);
            if (toMatch) {
              const tgtDb = toMatch[1] ? toMatch[1].replace(/[`]/g, '') : view.database;
              const tgtTbl = toMatch[2].replace(/[`]/g, '');
              if (tgtTbl) {
                targetTables = [{ database: tgtDb, table: tgtTbl }];
              }
            }
          }

          return {
            ...view,
            sources: sourceTables,
            targets: targetTables,
          };
        } catch (error) {
          console.error(`Error processing view ${view.name}:`, error);
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

import { NextResponse } from 'next/server';
import { getClientFromRequest, checkTableExists } from '@/lib/clickhouse';
import { GET_TABLE_DEPENDENCIES, GET_DEPENDENCIES_FROM_VIEWS } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');

    const client = await getClientFromRequest();

    // Get all tables
    const tablesQuery = `
      SELECT
        database,
        name as table,
        engine
      FROM system.tables
      WHERE database NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
        ${database ? `AND database = '${database}'` : ''}
      ORDER BY database, name
    `;

    const tablesResult = await client.query({
      query: tablesQuery,
      format: 'JSONEachRow',
    });

    const tables = await tablesResult.json();

    // Check if system.dependencies table exists (added in ClickHouse 20.3+)
    let dependencies = [];
    const hasDependenciesTable = await checkTableExists(client, 'system', 'dependencies');

    if (hasDependenciesTable) {
      // Use system.dependencies for newer ClickHouse versions
      try {
        const allDepsQuery = `
          SELECT
            database,
            table,
            dependent_database,
            dependent_table
          FROM system.dependencies
          ${database ? `WHERE database = '${database}' OR dependent_database = '${database}'` : ''}
        `;

        const depsResult = await client.query({
          query: allDepsQuery,
          format: 'JSONEachRow',
        });

        dependencies = await depsResult.json();
      } catch (error) {
        console.log('Failed to query system.dependencies, falling back to view-based detection:', error.message);
        hasDependenciesTable = false; // Force fallback
      }
    }

    // Fallback for older ClickHouse versions without system.dependencies
    if (!hasDependenciesTable || dependencies.length === 0) {
      try {
        // Extract dependencies from materialized views
        const viewDepsQuery = database
          ? GET_DEPENDENCIES_FROM_VIEWS.replace('{database}', database)
          : `
            SELECT
              database,
              name as dependent_table,
              dependencies_database as database,
              dependencies_table as table
            FROM system.tables
            WHERE engine = 'MaterializedView'
              AND dependencies_database != ''
              AND dependencies_table != ''
            ORDER BY database, name
          `;

        const viewDepsResult = await client.query({
          query: viewDepsQuery,
          format: 'JSONEachRow',
        });

        const viewDeps = await viewDepsResult.json();

        // Convert to standard dependencies format
        dependencies = viewDeps.map(vd => ({
          database: vd.database,
          table: vd.table,
          dependent_database: vd.database,
          dependent_table: vd.dependent_table,
        }));
      } catch (error) {
        console.error('Failed to extract dependencies from views:', error);
        // Continue with empty dependencies rather than failing
      }
    }

    // Build nodes and edges for the graph
    const nodes = tables.map(t => ({
      id: `${t.database}.${t.table}`,
      type: t.engine.includes('MaterializedView') ? 'materialized_view' : 'table',
      data: {
        label: t.table,
        database: t.database,
        engine: t.engine,
      },
    }));

    const edges = dependencies.map((dep, index) => ({
      id: `edge-${index}`,
      source: `${dep.database}.${dep.table}`,
      target: `${dep.dependent_database}.${dep.dependent_table}`,
      type: 'smoothstep',
      animated: true,
    }));

    return NextResponse.json({
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        tables: nodes.filter(n => n.type === 'table').length,
        views: nodes.filter(n => n.type === 'materialized_view').length,
      },
    });
  } catch (error) {
    console.error('Error fetching lineage data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lineage data' },
      { status: 500 }
    );
  }
}

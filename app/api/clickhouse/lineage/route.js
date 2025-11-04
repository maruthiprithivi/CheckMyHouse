import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';
import { GET_TABLE_DEPENDENCIES } from '@/lib/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');

    const client = getClickHouseClient();

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

    // Get all dependencies
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

    const dependencies = await depsResult.json();

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

/**
 * Test script for ClickHouse version compatibility
 *
 * This script tests the version detection and compatibility queries
 * to ensure they work with different ClickHouse versions.
 */

const { createClient } = require('@clickhouse/client');

async function testVersionCompatibility() {
  console.log('ClickHouse Version Compatibility Test');
  console.log('=====================================\n');

  // Configuration - Update with your ClickHouse connection details
  const config = {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'default',
  };

  const client = createClient(config);

  try {
    // Test 1: Get ClickHouse version
    console.log('Test 1: Getting ClickHouse version...');
    const versionResult = await client.query({
      query: 'SELECT version() as version',
      format: 'JSONEachRow',
    });
    const versionData = await versionResult.json();
    const versionString = versionData[0]?.version || 'unknown';
    console.log(`  Version: ${versionString}\n`);

    // Parse version
    const versionMatch = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
    const version = versionMatch ? {
      major: parseInt(versionMatch[1], 10),
      minor: parseInt(versionMatch[2], 10),
      patch: parseInt(versionMatch[3], 10),
    } : null;

    // Test 2: Check if codec_expression column exists
    console.log('Test 2: Checking codec_expression column...');
    try {
      const codecCheckResult = await client.query({
        query: `SELECT 1 FROM system.columns WHERE database = 'system' AND table = 'columns' AND name = 'codec_expression' LIMIT 1`,
        format: 'JSONEachRow',
      });
      const codecCheckData = await codecCheckResult.json();
      const hasCodecColumn = codecCheckData.length > 0;
      console.log(`  codec_expression exists: ${hasCodecColumn}`);
      console.log(`  Expected: ${version && (version.major > 20 || (version.major === 20 && version.minor >= 1))}\n`);
    } catch (error) {
      console.log(`  Error checking codec_expression: ${error.message}\n`);
    }

    // Test 3: Check if system.dependencies table exists
    console.log('Test 3: Checking system.dependencies table...');
    try {
      const depsCheckResult = await client.query({
        query: `SELECT 1 FROM system.tables WHERE database = 'system' AND name = 'dependencies' LIMIT 1`,
        format: 'JSONEachRow',
      });
      const depsCheckData = await depsCheckResult.json();
      const hasDependenciesTable = depsCheckData.length > 0;
      console.log(`  system.dependencies exists: ${hasDependenciesTable}`);
      console.log(`  Expected: ${version && (version.major > 20 || (version.major === 20 && version.minor >= 3))}\n`);
    } catch (error) {
      console.log(`  Error checking system.dependencies: ${error.message}\n`);
    }

    // Test 4: Test basic columns query (without codec_expression)
    console.log('Test 4: Testing basic columns query...');
    try {
      const basicColumnsResult = await client.query({
        query: `
          SELECT
            name,
            type,
            default_kind,
            default_expression,
            comment,
            ttl_expression,
            is_in_partition_key,
            is_in_sorting_key,
            is_in_primary_key,
            is_in_sampling_key
          FROM system.columns
          WHERE database = 'system'
            AND table = 'tables'
          LIMIT 5
        `,
        format: 'JSONEachRow',
      });
      const basicColumnsData = await basicColumnsResult.json();
      console.log(`  Success: Retrieved ${basicColumnsData.length} columns\n`);
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }

    // Test 5: Test extended columns query (with codec_expression)
    console.log('Test 5: Testing extended columns query...');
    try {
      const extendedColumnsResult = await client.query({
        query: `
          SELECT
            name,
            type,
            default_kind,
            default_expression,
            comment,
            codec_expression,
            ttl_expression,
            is_in_partition_key,
            is_in_sorting_key,
            is_in_primary_key,
            is_in_sampling_key
          FROM system.columns
          WHERE database = 'system'
            AND table = 'tables'
          LIMIT 5
        `,
        format: 'JSONEachRow',
      });
      const extendedColumnsData = await extendedColumnsResult.json();
      console.log(`  Success: Retrieved ${extendedColumnsData.length} columns with codec_expression\n`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log(`  This is expected for ClickHouse versions < 20.1\n`);
    }

    // Test 6: Test system.dependencies query
    console.log('Test 6: Testing system.dependencies query...');
    try {
      const depsResult = await client.query({
        query: `
          SELECT
            database,
            table,
            dependent_database,
            dependent_table
          FROM system.dependencies
          LIMIT 5
        `,
        format: 'JSONEachRow',
      });
      const depsData = await depsResult.json();
      console.log(`  Success: Retrieved ${depsData.length} dependencies\n`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log(`  This is expected for ClickHouse versions < 20.3\n`);
    }

    // Test 7: Test fallback dependencies query from views
    console.log('Test 7: Testing fallback dependencies query...');
    try {
      const fallbackDepsResult = await client.query({
        query: `
          SELECT
            database,
            name as dependent_table,
            dependencies_database as database,
            dependencies_table as table
          FROM system.tables
          WHERE engine = 'MaterializedView'
            AND dependencies_database != ''
            AND dependencies_table != ''
          LIMIT 5
        `,
        format: 'JSONEachRow',
      });
      const fallbackDepsData = await fallbackDepsResult.json();
      console.log(`  Success: Retrieved ${fallbackDepsData.length} dependencies from views\n`);
    } catch (error) {
      console.log(`  Error: ${error.message}\n`);
    }

    console.log('=====================================');
    console.log('All compatibility tests completed!');
    console.log('=====================================');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run tests
testVersionCompatibility().catch(console.error);

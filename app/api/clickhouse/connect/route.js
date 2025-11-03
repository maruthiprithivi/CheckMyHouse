import { NextResponse } from 'next/server';
import { testConnection, initClickHouseClient, detectClusterConfig } from '@/lib/clickhouse';

export async function POST(request) {
  try {
    const config = await request.json();

    // Test connection
    const testResult = await testConnection(config);

    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.message },
        { status: 400 }
      );
    }

    // Initialize client
    const client = initClickHouseClient(config);

    // Detect cluster configuration
    const clusterConfig = await detectClusterConfig(client);

    return NextResponse.json({
      success: true,
      message: 'Connected successfully',
      clusterConfig,
    });
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to ClickHouse' },
      { status: 500 }
    );
  }
}

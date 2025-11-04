import { NextResponse } from 'next/server';
import { testConnection, initClickHouseClient, detectClusterConfig } from '@/lib/clickhouse';
import { cookies } from 'next/headers';

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

    // Store config in cookies (httpOnly for security)
    // Note: Don't store sensitive data in production - use session storage instead
    const cookieStore = cookies();
    cookieStore.set('clickhouse_config', encodeURIComponent(JSON.stringify(config)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

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

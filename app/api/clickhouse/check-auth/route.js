import { NextResponse } from 'next/server';
import { getConfigFromCookies } from '@/lib/clickhouse';

/**
 * Check if user has valid authentication (connection config in cookies)
 */
export async function GET() {
  try {
    const config = await getConfigFromCookies();

    if (!config) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      host: config.host || config.url,
      username: config.username,
      database: config.database,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

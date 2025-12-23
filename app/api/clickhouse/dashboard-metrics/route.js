import { NextResponse } from 'next/server';
import {
  getClientFromRequest,
  executeQuerySafe,
} from '@/lib/clickhouse';
import { formatErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    let client;
    try {
      client = await getClientFromRequest();
    } catch (authError) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check cache
    const cacheKey = globalCache.generateKey('dashboard_metrics', {});
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Queries to fetch Revenue and User Count
    // Using star_schema.lineorder_flat_100 for revenue
    // Using star_schema.lineorder_flat_100 for user count (distinct customers) as a proxy
    const revenueQuery = `
      SELECT sum(LO_REVENUE) as total_revenue
      FROM star_schema.lineorder_flat_100
    `;

    const userCountQuery = `
      SELECT count(DISTINCT LO_CUSTKEY) as active_users
      FROM star_schema.lineorder_flat_100
    `;

    // Execute queries in parallel
    const [revenueResult, userResult] = await Promise.all([
      executeQuerySafe(client, revenueQuery),
      executeQuerySafe(client, userCountQuery),
    ]);

    const responseData = {
      revenue: revenueResult.success && revenueResult.data.length > 0
        ? Number(revenueResult.data[0].total_revenue)
        : 0,
      userCount: userResult.success && userResult.data.length > 0
        ? Number(userResult.data[0].active_users)
        : 0,
    };

    // Cache the response
    globalCache.set(cacheKey, responseData, CacheTTL.DASHBOARD_STATS || 60); // Default 60s if not defined

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}

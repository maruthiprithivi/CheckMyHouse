import { NextResponse } from 'next/server';
import { getClientFromRequest, getSystemCapabilities } from '@/lib/clickhouse';
import { formatErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    // Check cache first
    const cacheKey = 'system_capabilities';
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    const client = await getClientFromRequest();
    const capabilities = await getSystemCapabilities(client);

    // Cache the capabilities
    globalCache.set(cacheKey, capabilities, CacheTTL.CLUSTER_CONFIG);

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}

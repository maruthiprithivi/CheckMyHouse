# Error Handling Quick Reference

## For API Routes

### 1. Import Required Utilities

```javascript
import {
  getClientFromRequest,
  executeQuerySafe,
  getSystemCapabilities,
} from '@/lib/clickhouse';
import { formatErrorResponse, createPermissionErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';
```

### 2. Check Capabilities

```javascript
const capabilities = await getSystemCapabilities(client);
if (!capabilities.hasQueryLog) {
  return NextResponse.json(
    createPermissionErrorResponse('system.query_log', 'Feature Name'),
    { status: 403 }
  );
}
```

### 3. Implement Caching

```javascript
// Generate cache key
const cacheKey = globalCache.generateKey('prefix', { param1, param2 });

// Check cache
const cached = globalCache.get(cacheKey);
if (cached) {
  return NextResponse.json({ ...cached, cached: true });
}

// Execute query and cache result
const data = await executeQuerySafe(client, query);
globalCache.set(cacheKey, data, CacheTTL.QUERY_ANALYZER);
```

### 4. Handle Errors

```javascript
const result = await executeQuerySafe(client, query);

if (!result.success) {
  if (result.permissionDenied) {
    return NextResponse.json(
      createPermissionErrorResponse('system.table', 'Feature'),
      { status: 403 }
    );
  }

  if (result.quotaExceeded) {
    return NextResponse.json(
      formatErrorResponse(result.error, true),
      { status: 429 }
    );
  }

  return NextResponse.json(
    formatErrorResponse(result.error, false),
    { status: 500 }
  );
}

// Use result.data
return NextResponse.json({ data: result.data });
```

## For React Pages

### 1. Import Components

```javascript
import ErrorBoundary, {
  PermissionError,
  QuotaExceededError,
} from '@/components/ErrorBoundary';
import { CapabilityBanner } from '@/components/ui/CapabilityIndicator';
```

### 2. Add State

```javascript
const [error, setError] = useState(null);
const [capabilities, setCapabilities] = useState(null);
```

### 3. Fetch Capabilities

```javascript
useEffect(() => {
  fetch('/api/clickhouse/capabilities')
    .then((r) => r.json())
    .then(setCapabilities);
}, []);
```

### 4. Handle API Errors

```javascript
const fetchData = async () => {
  const response = await fetch('/api/...');
  const data = await response.json();

  if (!response.ok) {
    setError({
      type: data.type,
      message: data.error,
      requirements: data.requirements,
      quotaInfo: data.quotaInfo,
      retryAfter: data.retryAfter,
      feature: data.feature,
    });
    return;
  }

  setData(data);
  setError(null);
};
```

### 5. Render Error Components

```javascript
return (
  <ErrorBoundary>
    <CapabilityBanner capabilities={capabilities} />

    {error?.type === 'PERMISSION_DENIED' && (
      <PermissionError
        feature={error.feature}
        table="system.query_log"
        requirements={error.requirements}
        onDismiss={() => setError(null)}
      />
    )}

    {error?.type === 'QUOTA_EXCEEDED' && (
      <QuotaExceededError
        quotaInfo={error.quotaInfo}
        retryAfter={error.retryAfter}
        onRetry={fetchData}
      />
    )}

    {!error && <YourContentHere />}
  </ErrorBoundary>
);
```

## Cache TTL Values

```javascript
CacheTTL.DATABASES          // 300s (5 minutes)
CacheTTL.TABLES            // 300s (5 minutes)
CacheTTL.COLUMNS           // 300s (5 minutes)
CacheTTL.CLUSTER_CONFIG    // 600s (10 minutes)
CacheTTL.TABLE_STATS       // 60s (1 minute)
CacheTTL.QUERY_ANALYZER    // 60s (1 minute)
CacheTTL.SLOW_QUERIES      // 30s (30 seconds)
CacheTTL.QUERY_DRILLDOWN   // 10s (10 seconds)
CacheTTL.MONITORING        // 5s (5 seconds)
```

## Error Types

```javascript
ErrorTypes.PERMISSION_DENIED   // User lacks privileges
ErrorTypes.QUOTA_EXCEEDED      // Query quota exceeded
ErrorTypes.CONNECTION_ERROR    // Can't connect to server
ErrorTypes.QUERY_ERROR         // Query syntax error
ErrorTypes.TIMEOUT            // Query timed out
ErrorTypes.UNKNOWN            // Other errors
```

## System Capabilities

```javascript
capabilities.hasQueryLog      // system.query_log access
capabilities.hasClusters      // system.clusters access
capabilities.hasParts         // system.parts access
capabilities.hasProcesses     // system.processes access
```

## Complete Example: New API Route

```javascript
import { NextResponse } from 'next/server';
import {
  getClientFromRequest,
  executeQuerySafe,
  getSystemCapabilities,
} from '@/lib/clickhouse';
import { formatErrorResponse, createPermissionErrorResponse } from '@/lib/errors';
import globalCache, { CacheTTL } from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const param1 = searchParams.get('param1');

    const client = await getClientFromRequest();

    // 1. Check capabilities
    const capabilities = await getSystemCapabilities(client);
    if (!capabilities.hasQueryLog) {
      return NextResponse.json(
        createPermissionErrorResponse('system.query_log', 'My Feature'),
        { status: 403 }
      );
    }

    // 2. Check cache
    const cacheKey = globalCache.generateKey('my_feature', { param1 });
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // 3. Execute query
    const query = `SELECT * FROM system.query_log WHERE ...`;
    const result = await executeQuerySafe(client, query);

    // 4. Handle errors
    if (!result.success) {
      if (result.permissionDenied) {
        return NextResponse.json(
          createPermissionErrorResponse('system.query_log', 'My Feature'),
          { status: 403 }
        );
      }

      if (result.quotaExceeded) {
        return NextResponse.json(
          formatErrorResponse(result.error, true),
          { status: 429 }
        );
      }

      return NextResponse.json(
        formatErrorResponse(result.error, false),
        { status: 500 }
      );
    }

    // 5. Cache and return
    const responseData = { data: result.data };
    globalCache.set(cacheKey, responseData, CacheTTL.QUERY_ANALYZER);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      formatErrorResponse(error, false),
      { status: 500 }
    );
  }
}
```

## Complete Example: New React Page

```javascript
'use client';

import { useState, useEffect } from 'react';
import ErrorBoundary, {
  PermissionError,
  QuotaExceededError,
} from '@/components/ErrorBoundary';
import { CapabilityBanner } from '@/components/ui/CapabilityIndicator';

export default function MyPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapabilities();
    fetchData();
  }, []);

  const fetchCapabilities = async () => {
    try {
      const response = await fetch('/api/clickhouse/capabilities');
      const data = await response.json();
      if (response.ok) {
        setCapabilities(data);
      }
    } catch (error) {
      console.error('Error fetching capabilities:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/my-feature?param1=value');
      const data = await response.json();

      if (!response.ok) {
        setError({
          type: data.type,
          message: data.error,
          requirements: data.requirements,
          quotaInfo: data.quotaInfo,
          retryAfter: data.retryAfter,
          feature: data.feature,
        });
        return;
      }

      setData(data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError({
        type: 'UNKNOWN',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container">
        <h1>My Feature</h1>

        <CapabilityBanner capabilities={capabilities} />

        {error?.type === 'PERMISSION_DENIED' && (
          <PermissionError
            feature={error.feature || 'My Feature'}
            table="system.query_log"
            requirements={error.requirements}
            onDismiss={() => setError(null)}
          />
        )}

        {error?.type === 'QUOTA_EXCEEDED' && (
          <QuotaExceededError
            quotaInfo={error.quotaInfo}
            retryAfter={error.retryAfter}
            onRetry={fetchData}
          />
        )}

        {!error && !loading && (
          <div>
            {/* Your content here */}
            {data.map((item) => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        )}

        {loading && <div>Loading...</div>}
      </div>
    </ErrorBoundary>
  );
}
```

## Testing Commands

```bash
# Test permission error
# Connect with limited user, navigate to Query Analyzer
# Should show permission error with GRANT statement

# Test quota error
# Execute many queries rapidly
# Should show quota error with countdown

# Test caching
# Make same request twice
# Second should be faster and include "cached": true

# Check capabilities
curl http://localhost:3000/api/clickhouse/capabilities

# Check cache stats (add this to your code)
import { getCacheStats } from '@/lib/cache';
console.log(getCacheStats());
```

## Troubleshooting

### Cache not working?
- Check that response status is 200
- Verify cache TTL is appropriate
- Check cache stats with `getCacheStats()`

### Permission error persists after granting?
- Wait 10 minutes for capability cache to expire
- Or restart application to clear cache

### Features still unavailable?
- Check `/api/clickhouse/capabilities`
- Verify GRANT statements are correct
- Check ClickHouse user has SELECT on specific columns

### Quota errors?
- Reduce query frequency
- Implement longer cache TTL
- Contact admin for quota increase

## Files Reference

```
lib/
  errors.js              - Error parsing and formatting
  cache.js               - Caching and rate limiting
  clickhouse.js          - Enhanced client

components/
  ErrorBoundary.js       - Error boundary and error components
  ui/
    CapabilityIndicator.js - Capability indicators

app/api/clickhouse/
  capabilities/route.js  - Capabilities endpoint
  query-analyzer/
    aggregate/route.js   - Example with error handling
    slow-queries/route.js - Example with error handling
  stats/route.js         - Example with error handling
```

## Documentation

- `ERROR_HANDLING_GUIDE.md` - Complete guide (detailed)
- `ERROR_HANDLING_SUMMARY.md` - Summary with examples (overview)
- `ERROR_HANDLING_QUICK_REFERENCE.md` - This file (quick lookup)

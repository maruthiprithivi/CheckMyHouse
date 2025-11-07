# ClickHouse Version Compatibility

This document describes the version compatibility fixes implemented in CheckMyHouse to support ClickHouse versions 19.x through 24.x+.

## Critical Issues Fixed

### 1. codec_expression Column Missing (ClickHouse < 20.1)

**Issue**: The `codec_expression` column was added to `system.columns` in ClickHouse 20.1. Queries using this column fail on older versions with:
```
Unknown expression identifier 'codec_expression'
```

**Solution**: Implemented dual-query approach with version detection:
- Basic query without `codec_expression` (default, works on all versions)
- Extended query with `codec_expression` (for ClickHouse 20.1+)

**Files Modified**:
- `/lib/queries.js` - Added `GET_TABLE_COLUMNS_WITH_CODEC` query
- `/app/api/clickhouse/tables/route.js` - Added version detection and fallback logic

### 2. system.dependencies Table Missing (ClickHouse < 20.3)

**Issue**: The `system.dependencies` table was added in ClickHouse 20.3. Queries using this table fail on older versions with:
```
Unknown table expression identifier 'system.dependencies'
```

**Solution**: Implemented multi-tier fallback approach:
1. Try `system.dependencies` if available (ClickHouse 20.3+)
2. Fall back to extracting dependencies from materialized view metadata
3. Parse dependencies from CREATE TABLE statements

**Files Modified**:
- `/lib/queries.js` - Added `GET_DEPENDENCIES_FROM_VIEWS` fallback query
- `/app/api/clickhouse/lineage/route.js` - Added table existence check and fallback logic
- `/app/api/clickhouse/materialized-views/route.js` - Added multiple fallback strategies

## New Utility Functions

### Version Detection

```javascript
// Get ClickHouse version information
const version = await getClickHouseVersion(client);
// Returns: { full: "20.3.4.11", major: 20, minor: 3, patch: 4 }
```

### Table/Column Existence Checks

```javascript
// Check if a table exists
const hasTable = await checkTableExists(client, 'system', 'dependencies');

// Check if a column exists
const hasColumn = await checkColumnExists(client, 'system', 'columns', 'codec_expression');
```

**File**: `/lib/clickhouse.js`

## Version Compatibility Matrix

| Feature | ClickHouse Version | Status |
|---------|-------------------|--------|
| Basic table columns | 19.x+ | Supported |
| codec_expression | 20.1+ | Supported with fallback |
| system.dependencies | 20.3+ | Supported with fallback |
| View metadata (dependencies_database, dependencies_table) | 19.x+ | Supported (fallback) |

## Testing

A test script is provided to verify compatibility with your ClickHouse instance:

```bash
# Set connection parameters
export CLICKHOUSE_URL=http://localhost:8123
export CLICKHOUSE_USER=default
export CLICKHOUSE_PASSWORD=your_password
export CLICKHOUSE_DATABASE=default

# Run tests
node test-version-compatibility.js
```

The test script will:
1. Detect your ClickHouse version
2. Check for codec_expression column availability
3. Check for system.dependencies table availability
4. Test both basic and extended queries
5. Verify fallback mechanisms work correctly

## Implementation Details

### Query Selection Logic

**For Table Columns** (`/app/api/clickhouse/tables/route.js`):
```javascript
// Default to basic query
let columnsQuery = GET_TABLE_COLUMNS;

// Check version and column availability
const version = await getClickHouseVersion(client);
const hasCodecColumn = await checkColumnExists(client, 'system', 'columns', 'codec_expression');

// Use extended query if codec_expression is available
if ((version.major >= 20 && version.minor >= 1) || hasCodecColumn) {
  columnsQuery = GET_TABLE_COLUMNS_WITH_CODEC;
}
```

**For Dependencies** (`/app/api/clickhouse/lineage/route.js`):
```javascript
// Check if system.dependencies exists
const hasDependenciesTable = await checkTableExists(client, 'system', 'dependencies');

if (hasDependenciesTable) {
  // Use system.dependencies (preferred)
  dependencies = await querySystemDependencies(client);
} else {
  // Fall back to extracting from view metadata
  dependencies = await extractDependenciesFromViews(client);
}
```

### Materialized Views Enhanced Fallback

The materialized views route implements a three-tier fallback strategy:

1. **Primary**: Use `system.dependencies` table if available
2. **Fallback 1**: Extract from view metadata (`dependencies_database`, `dependencies_table`)
3. **Fallback 2**: Parse FROM clause in CREATE TABLE statements

This ensures dependencies are discovered even on the oldest ClickHouse versions.

## Error Handling

All compatibility queries include proper error handling:

```javascript
try {
  // Try preferred approach
  const result = await preferredQuery();
} catch (error) {
  console.log('Primary method failed, using fallback:', error.message);
  // Fall back to compatible approach
  const result = await fallbackQuery();
}
```

Errors are logged but don't break the application. Missing features result in:
- Empty arrays for dependencies
- Basic column information without codec details
- Graceful degradation of functionality

## Performance Considerations

### Version Detection Caching

The ClickHouse version is cached after first detection to avoid repeated queries:

```javascript
let cachedVersion = null;

export async function getClickHouseVersion(client) {
  if (cachedVersion) {
    return cachedVersion; // Return cached version
  }
  // Fetch and cache version...
}
```

### Existence Check Optimization

Table/column existence checks are performed once per route execution and the results are reused within that request context.

## Migration Path

If you're running an older ClickHouse version and plan to upgrade:

1. **ClickHouse 19.x**: Application works with basic functionality
   - Dependencies extracted from view metadata only
   - No codec information in column details

2. **ClickHouse 20.1 - 20.2**: Codec expressions now available
   - Column details include compression codec information
   - Dependencies still from view metadata

3. **ClickHouse 20.3+**: Full feature support
   - All dependency types tracked in system.dependencies
   - Complete lineage graph available
   - All features work optimally

## Troubleshooting

### Version Detection Fails

If version detection fails, the application assumes ClickHouse 19.x (most conservative approach) and uses only basic queries:

```javascript
catch (error) {
  console.error('Error detecting ClickHouse version:', error);
  // Return safe default
  cachedVersion = { full: 'unknown', major: 19, minor: 0, patch: 0 };
}
```

### Dependencies Not Showing

If dependencies aren't appearing in the lineage graph:

1. Check if you have materialized views (required for fallback on older versions)
2. Verify view CREATE statements include explicit database.table references
3. Check console logs for fallback messages
4. Run the test script to verify compatibility

### Column Information Missing

If codec_expression or other columns are missing:

1. This is normal for ClickHouse < 20.1
2. The application will work correctly with reduced column information
3. Consider upgrading ClickHouse for full feature support

## Best Practices

1. **Always test with your ClickHouse version** before deploying to production
2. **Monitor console logs** for fallback usage and compatibility issues
3. **Use the test script** when upgrading ClickHouse versions
4. **Keep ClickHouse updated** for best performance and features
5. **Document your version** in deployment configuration

## Future Enhancements

Potential improvements for version compatibility:

1. Display ClickHouse version in the UI
2. Show feature availability based on detected version
3. Add version-specific recommendations
4. Implement automatic feature discovery
5. Add compatibility warnings for deprecated features

## Support

For issues related to version compatibility:

1. Run the test script and share output
2. Check ClickHouse version: `SELECT version()`
3. Verify table existence: `SHOW TABLES FROM system`
4. Check column availability: `DESCRIBE system.columns`
5. Review application logs for fallback messages

# CheckMyHouse - ClickHouse Database Explorer 🏠

A comprehensive, visually engaging database explorer and query analyzer for ClickHouse databases. Built with Next.js 15 and optimized for performance with memory-safe operations.

## Features

### 🔍 Query Analyzer
- **Comprehensive Metrics**: Track 180+ metrics including:
  - Query latency (min, max, avg, P50, P90, P95, P99)
  - Memory usage with peak tracking
  - CPU metrics (user, system, **wait time**)
  - I/O operations (rows and bytes)
  - Network traffic
  - Cache hit rates
  - Thread utilization

- **Aggregate View**: Group queries by `normalized_query_hash` for pattern analysis
- **Drill-Down View**: Explore individual query executions with:
  - Time-series charts (duration, memory over time)
  - Detailed profiling metrics
  - Expandable row details
  - SQL syntax highlighting
- **Performance Insights**: Automatic bottleneck detection and recommendations
- **Cluster-Aware**: Supports both ClickHouse Cloud and OSS with automatic cluster detection

### 📊 Table Explorer
- **Visual Table Browser**: Card-based interface with table engines
- **Detailed Table View** with tabs:
  - **Schema**: Columns, data types, keys, codecs
  - **Statistics**: Row counts, compression ratios, storage sizes
  - **Parts & Partitions**: Active parts with modification times
  - **DDL**: CREATE TABLE statement with syntax highlighting
- Table engine information and configuration
- Partition and sorting key visualization
- Compression analytics

### 👁️ Materialized Views Explorer
- Discover all materialized views across databases
- **Data Flow Visualization**: Source → MV → Target mapping
- **SQL Transformation Viewer** with syntax highlighting
- **Complexity Analysis**: Identify simple vs complex transformations
- Dependency tracking and impact analysis
- Source and target table relationships

### 🔗 Data Lineage Graph
- **Interactive Visual Graph** powered by React Flow
- Table and materialized view nodes with distinct styling
- Real-time dependency mapping
- Pan, zoom, and drag functionality
- Minimap for large dependency graphs
- Click nodes for detailed information
- Filter by database

### 🐌 Slow Queries Dashboard
- Configurable performance thresholds
- Real-time slow query detection
- Summary statistics and trends
- Query detail view with full SQL
- Error tracking and analysis
- Performance indicators with color coding

### 📤 Export Functionality
- **CSV Export**: Download query metrics, tables, and materialized views
- **JSON Export**: Export data in JSON format for further analysis
- **Formatted Data**: Pre-formatted exports with all key metrics
- **One-Click Download**: Dropdown menu integration in query analyzer

### 💡 Recommendations Engine
- **Index Recommendations**: Suggests skip indexes, bloom filters based on query patterns
- **Query Optimizations**: Detects I/O bottlenecks, cache inefficiency, memory issues
- **Table Health**: Identifies excessive parts, poor compression, partitioning needs
- **Materialized View Opportunities**: Suggests MVs for frequent aggregations
- **Severity Indicators**: Color-coded recommendations (critical/warning/info)
- **Impact Assessment**: Effort and impact estimates for each recommendation

### 📊 Real-Time Monitoring
- **Live Dashboard**: Auto-refreshing metrics every 30 seconds
- **Summary Cards**: Total queries, average duration, error rate, table count
- **Query Type Distribution**: Pie chart visualization of SELECT/INSERT/ALTER queries
- **Top Slow Queries**: Bar chart of slowest queries by duration
- **Memory Analysis**: Visual breakdown of memory usage by query
- **System Health**: Performance, error rate, and system load indicators

### 💾 Memory Management
- Virtual scrolling for large datasets
- Pagination and lazy loading
- LRU caching with TTL
- Memory pressure monitoring
- Optimized for browsers handling 1000+ tables

## Tech Stack

- **Framework**: Next.js 15 (App Router, JavaScript)
- **UI**: Tailwind CSS + Custom Components
- **ClickHouse Client**: @clickhouse/client
- **Virtualization**: react-window + react-virtualized-auto-sizer
- **Charts**: Recharts for time-series and performance visualization
- **Data Lineage**: ReactFlow for interactive dependency graphs
- **Syntax Highlighting**: react-syntax-highlighter for SQL

## Installation

### Prerequisites
- Node.js 18+ and npm
- Access to a ClickHouse database (Cloud or OSS)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/maruthiprithivi/CheckMyHouse.git
cd CheckMyHouse
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Connecting to ClickHouse

1. On first launch, you'll see the connection form
2. Enter your ClickHouse connection details:
   - **Host URL**: HTTP interface URL (e.g., `http://localhost:8123` or `https://your-cluster.clickhouse.cloud:8443`)
   - **Username**: Your ClickHouse username (default: `default`)
   - **Password**: Your password
   - **Database**: Initial database (default: `default`)

3. Click "Connect to ClickHouse"

### Query Analyzer

1. Navigate to **Query Analyzer** from the main menu
2. Adjust filters:
   - **Time Range**: Analyze queries from last 1-30 days
   - **Sort By**: Choose from 20+ sorting options
   - **Min Executions**: Filter out infrequent queries
   - **Results Limit**: Control dataset size for performance

3. Click on any query to see:
   - Full metrics breakdown (all percentiles)
   - Performance indicators with color coding
   - Automated insights and recommendations
   - Resource consumption patterns

### Cluster Support

CheckMyHouse automatically detects your ClickHouse configuration:

- **ClickHouse Cloud**: Single-node optimized queries
- **ClickHouse OSS with Cluster**: Uses `clusterAllReplicas()` for comprehensive data collection
- **Sharding Detection**: Identifies sharded vs replicated setups

## Project Structure

```
CheckMyHouse/
├── app/
│   ├── api/clickhouse/          # API routes
│   │   ├── connect/             # Connection handling
│   │   ├── databases/           # Database discovery
│   │   ├── tables/              # Table metadata
│   │   ├── query-analyzer/      # Query analysis endpoints
│   │   ├── lineage/             # Data lineage endpoints
│   │   └── materialized-views/  # MV discovery endpoints
│   ├── dashboard/               # Main dashboard
│   ├── query-analyzer/          # Query analyzer UI
│   ├── tables/                  # Table explorer UI
│   ├── materialized-views/      # MV explorer UI
│   ├── lineage/                 # Data lineage graph UI
│   ├── slow-queries/            # Slow queries dashboard
│   ├── monitoring/              # Real-time monitoring dashboard
│   └── globals.css              # Global styles
├── components/
│   ├── Dashboard/               # Dashboard components
│   ├── QueryAnalyzer/           # Query analyzer components
│   ├── TableExplorer/           # Table browser components
│   ├── Recommendations/         # Recommendations panel
│   └── ui/                      # Reusable UI components (ExportMenu, etc.)
├── lib/
│   ├── clickhouse.js            # ClickHouse client & utilities
│   └── queries.js               # SQL query templates
├── utils/
│   ├── formatters.js            # Data formatting utilities
│   ├── performanceIndicators.js # Performance thresholds & insights
│   ├── memoryManagement.js      # Memory optimization utilities
│   ├── exportUtils.js           # CSV/JSON export utilities
│   ├── recommendations.js       # Recommendations engine
│   └── constants.js             # Application constants
└── public/                      # Static assets
```

## Configuration

### Environment Variables (Optional)

Create a `.env.local` file for default values:

```env
NEXT_PUBLIC_DEFAULT_HOST=http://localhost:8123
NEXT_PUBLIC_DEFAULT_USER=default
```

Note: Connection details are stored in browser localStorage, not sent to external servers.

## Performance Optimization

### Memory Management
- **Virtual Scrolling**: Only renders visible rows (50-100 items)
- **Pagination**: API responses limited to 500 items max
- **Caching**: LRU cache with 5-minute TTL
- **Data Sampling**: Charts use max 200 data points

### Query Optimization
- Queries limited to 10,000 rows by default
- Configurable time ranges to reduce data volume
- Cluster-aware query optimization
- Automatic query timeout (5 minutes)

## System Requirements

### ClickHouse
- ClickHouse 21.1+ (for full query_log support)
- Access to `system` tables:
  - `system.query_log`
  - `system.databases`
  - `system.tables`
  - `system.columns`
  - `system.parts`
  - `system.clusters` (for clustered setups)

### Browser
- Modern browser with JavaScript enabled
- Recommended: Chrome 90+, Firefox 90+, Safari 14+
- Minimum 4GB RAM for optimal performance

## Development

### Build for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] ClickHouse connection with cluster detection
- [x] Database and table discovery
- [x] Query analyzer with comprehensive metrics
- [x] Memory-optimized rendering
- [x] Performance insights

### Phase 2: Advanced Features (✅ Complete)
- [x] Table explorer with detailed views
- [x] Materialized views explorer
- [x] Visual data lineage graph
- [x] Table statistics dashboard
- [x] Query drill-down with time-series charts
- [x] Slow queries dashboard
- [x] SQL syntax highlighting
- [x] Charts and visualizations (Recharts)

### Phase 3: Enterprise Features (✅ Complete)
- [x] Export to CSV/JSON
- [x] Query recommendations engine
- [x] Table health recommendations
- [x] Index optimization suggestions
- [x] Real-time monitoring dashboard
- [x] Performance insights and alerts

### Phase 4: Future Enhancements
- [ ] Resource hog detection dashboard
- [ ] Query anomaly detection with ML
- [ ] Query comparison tool
- [ ] Custom alert configuration
- [ ] Dark mode
- [ ] Query favorites and bookmarks
- [ ] Custom dashboards builder
- [ ] Advanced filtering and saved filters
- [ ] Multi-cluster management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ClickHouse team for the excellent database
- Next.js team for the framework
- Open-source community for the amazing libraries

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

Built with ❤️ for the ClickHouse community

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
- **Drill-Down**: Explore individual query executions with detailed profiling
- **Performance Insights**: Automatic bottleneck detection and recommendations
- **Cluster-Aware**: Supports both ClickHouse Cloud and OSS with automatic cluster detection

### 📊 Database Explorer
- Database and table discovery
- Table schema visualization
- Column types and constraints
- Table statistics (row counts, sizes, parts)
- Table engine information
- Partitions and indexes

### 👁️ Materialized Views Explorer
- List all materialized views
- Source and target table mapping
- SQL definition viewer
- Dependency tracking

### 🔗 Data Lineage (Planned)
- Visual graph of data flow
- Table dependencies
- Materialized view relationships

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
- **Virtualization**: react-window
- **Charts**: Recharts (ready for integration)
- **Data Lineage**: ReactFlow (ready for integration)

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
│   │   └── query-analyzer/      # Query analysis endpoints
│   ├── dashboard/               # Main dashboard
│   ├── query-analyzer/          # Query analyzer UI
│   └── globals.css              # Global styles
├── components/
│   ├── Dashboard/               # Dashboard components
│   ├── QueryAnalyzer/           # Query analyzer components
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── clickhouse.js            # ClickHouse client & utilities
│   └── queries.js               # SQL query templates
├── utils/
│   ├── formatters.js            # Data formatting utilities
│   ├── performanceIndicators.js # Performance thresholds & insights
│   ├── memoryManagement.js      # Memory optimization utilities
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
- [x] Database and table explorer
- [x] Query analyzer with comprehensive metrics
- [x] Memory-optimized rendering
- [x] Performance insights

### Phase 2: Advanced Features (In Progress)
- [ ] Table explorer with virtual scrolling
- [ ] Materialized views explorer
- [ ] Visual data lineage graph
- [ ] Table statistics dashboard
- [ ] Query drill-down with time-series charts

### Phase 3: Enhanced Analysis
- [ ] Slow query dashboard
- [ ] Resource hog detection
- [ ] Cache performance analyzer
- [ ] Query anomaly detection
- [ ] Export to CSV/JSON

### Phase 4: Polish
- [ ] Dark mode
- [ ] Query favorites
- [ ] Custom dashboards
- [ ] Alert configuration
- [ ] Multi-cluster support

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

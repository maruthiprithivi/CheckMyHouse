import { formatBytes, formatDuration, formatNumber, formatPercent } from '@/utils/formatters';
import { PerformanceBadge } from '@/components/ui/PerformanceIndicator';
import {
  getDurationIndicator,
  getMemoryIndicator,
  getCPUWaitIndicator,
  getCacheIndicator,
} from '@/utils/performanceIndicators';

export default function MetricsGrid({ data, expanded = false }) {
  const durationIndicator = getDurationIndicator(data.p99_duration_ms);
  const memoryIndicator = getMemoryIndicator(data.p99_memory_bytes);
  const cpuWaitIndicator = getCPUWaitIndicator(data.io_wait_ratio || 0);
  const cacheIndicator = getCacheIndicator(data.disk_cache_hit_rate || 0);

  return (
    <div className="space-y-4">
      {/* Duration Metrics */}
      <MetricSection title="Query Latency" icon="⏱️">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricItem label="Avg" value={formatDuration(data.avg_duration_ms)} />
          <MetricItem label="P50" value={formatDuration(data.p50_duration_ms)} />
          <MetricItem label="P90" value={formatDuration(data.p90_duration_ms)} />
          <MetricItem label="P95" value={formatDuration(data.p95_duration_ms)} />
          <MetricItem
            label="P99"
            value={formatDuration(data.p99_duration_ms)}
            badge={durationIndicator.level}
          />
          <MetricItem label="Max" value={formatDuration(data.max_duration_ms)} />
          <MetricItem label="Min" value={formatDuration(data.min_duration_ms)} />
          <MetricItem label="Total" value={formatDuration(data.total_duration_ms)} />
        </div>
      </MetricSection>

      {/* Memory Metrics */}
      <MetricSection title="Memory Usage" icon="🧠">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricItem label="Avg" value={formatBytes(data.avg_memory_bytes)} />
          <MetricItem label="P50" value={formatBytes(data.p50_memory_bytes)} />
          <MetricItem label="P90" value={formatBytes(data.p90_memory_bytes)} />
          <MetricItem label="P95" value={formatBytes(data.p95_memory_bytes)} />
          <MetricItem
            label="P99"
            value={formatBytes(data.p99_memory_bytes)}
            badge={memoryIndicator.level}
          />
          <MetricItem label="Max" value={formatBytes(data.max_memory_bytes)} />
          <MetricItem label="Peak Avg" value={formatBytes(data.avg_peak_memory_bytes)} />
          <MetricItem label="Peak P99" value={formatBytes(data.p99_peak_memory_bytes)} />
        </div>
      </MetricSection>

      {/* CPU Metrics */}
      <MetricSection title="CPU Metrics" icon="⚡">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricItem label="User P99" value={`${data.p99_cpu_user_seconds?.toFixed(2)}s`} />
          <MetricItem label="System P99" value={`${data.p99_cpu_system_seconds?.toFixed(2)}s`} />
          <MetricItem
            label="Wait P99"
            value={`${data.p99_cpu_wait_seconds?.toFixed(2)}s`}
            badge={cpuWaitIndicator.level}
          />
          <MetricItem label="Total CPU" value={`${data.total_cpu_user_seconds?.toFixed(2)}s`} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">I/O Wait Ratio:</span>
          <PerformanceBadge level={cpuWaitIndicator.level}>
            {formatPercent(data.io_wait_ratio || 0)}
          </PerformanceBadge>
        </div>
      </MetricSection>

      {expanded && (
        <>
          {/* Rows Processed */}
          <MetricSection title="Rows Processed" icon="📊">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricItem label="Read Avg" value={formatNumber(data.avg_read_rows)} />
              <MetricItem label="Read P99" value={formatNumber(data.p99_read_rows)} />
              <MetricItem label="Written Avg" value={formatNumber(data.avg_written_rows)} />
              <MetricItem label="Written P99" value={formatNumber(data.p99_written_rows)} />
              <MetricItem label="Result Avg" value={formatNumber(data.avg_result_rows)} />
              <MetricItem label="Total Read" value={formatNumber(data.total_read_rows)} />
            </div>
          </MetricSection>

          {/* I/O Metrics */}
          <MetricSection title="I/O Operations" icon="💾">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricItem label="Read Avg" value={formatBytes(data.avg_read_bytes)} />
              <MetricItem label="Read P99" value={formatBytes(data.p99_read_bytes)} />
              <MetricItem label="Written Avg" value={formatBytes(data.avg_written_bytes)} />
              <MetricItem label="Written P99" value={formatBytes(data.p99_written_bytes)} />
              <MetricItem label="OS Read P99" value={formatBytes(data.p99_os_read_bytes)} />
              <MetricItem label="Total Read" value={formatBytes(data.total_read_bytes)} />
            </div>
          </MetricSection>

          {/* Network Traffic */}
          {data.total_network_send_bytes > 0 && (
            <MetricSection title="Network Traffic" icon="🌐">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricItem label="Send Avg" value={formatBytes(data.avg_network_send_bytes)} />
                <MetricItem label="Send P99" value={formatBytes(data.p99_network_send_bytes)} />
                <MetricItem label="Receive Avg" value={formatBytes(data.avg_network_receive_bytes)} />
                <MetricItem label="Total Send" value={formatBytes(data.total_network_send_bytes)} />
              </div>
            </MetricSection>
          )}

          {/* Cache Efficiency */}
          <MetricSection title="Cache Efficiency" icon="🎯">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricItem
                label="Disk Cache Hit Rate"
                value={formatPercent(data.disk_cache_hit_rate || 0)}
                badge={cacheIndicator.level}
              />
              <MetricItem
                label="Mark Cache Hit Rate"
                value={formatPercent(data.mark_cache_hit_rate || 0)}
              />
              <MetricItem
                label="Result Efficiency"
                value={formatPercent(data.result_efficiency || 0)}
              />
              <MetricItem
                label="Rows/Second"
                value={formatNumber(data.avg_rows_per_second || 0)}
              />
            </div>
          </MetricSection>

          {/* Thread Usage */}
          <MetricSection title="Thread Usage" icon="🧵">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricItem label="Avg Threads" value={formatNumber(data.avg_thread_count, 1)} />
              <MetricItem label="P50 Threads" value={formatNumber(data.p50_thread_count)} />
              <MetricItem label="P90 Threads" value={formatNumber(data.p90_thread_count)} />
              <MetricItem label="P99 Threads" value={formatNumber(data.p99_thread_count)} />
            </div>
          </MetricSection>
        </>
      )}
    </div>
  );
}

function MetricSection({ title, icon, children }) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <span>{icon}</span>
        <span>{title}</span>
      </h4>
      {children}
    </div>
  );
}

function MetricItem({ label, value, badge }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {badge && (
          <span className="text-xs">
            {badge === 'critical' && '🔴'}
            {badge === 'warning' && '🟡'}
            {badge === 'good' && '🔵'}
            {badge === 'excellent' && '🟢'}
          </span>
        )}
      </div>
    </div>
  );
}

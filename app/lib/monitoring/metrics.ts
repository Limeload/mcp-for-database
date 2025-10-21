import client from "prom-client";

client.collectDefaultMetrics({ prefix: "mcp_" });

const register = client.register;

// Query metrics
export const queryDurationSeconds = new client.Histogram({
  name: "mcp_query_duration_seconds",
  help: "Query execution duration in seconds",
  labelNames: ["query_name", "user_id", "status", "db"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// Query counter (total queries)
export const queryCount = new client.Counter({
  name: "mcp_query_total",
  help: "Total number of queries executed",
  labelNames: ["query_name", "user_id", "status", "db"],
});

// Connection pool gauges
export const poolTotal = new client.Gauge({
  name: "mcp_pool_total_connections",
  help: "Total connections in pool",
  labelNames: ["pool_id"],
});
export const poolIdle = new client.Gauge({
  name: "mcp_pool_idle_connections",
  help: "Idle connections in pool",
  labelNames: ["pool_id"],
});
export const poolWaiting = new client.Gauge({
  name: "mcp_pool_waiting_requests",
  help: "Requests waiting for a connection",
  labelNames: ["pool_id"],
});

// User activity: counts of actions per user
export const userActivityCounter = new client.Counter({
  name: "mcp_user_activity_total",
  help: "User activity counters",
  labelNames: ["user_id", "action"],
});

// System health gauges (set from code)
export const eventLoopLagMs = new client.Gauge({
  name: "mcp_event_loop_lag_ms",
  help: "Event loop lag in milliseconds",
});
export const memoryUsageBytes = new client.Gauge({
  name: "mcp_memory_rss_bytes",
  help: "RSS memory usage in bytes",
});

// Utility helper for safe labels
function safeLabel(v?: string) {
  return v ? String(v) : "unknown";
}

export class MetricsCollector {
  recordQueryExecution(opts: {
    queryName?: string;
    durationMs: number;
    userId?: string;
    status?: "success" | "error";
    db?: string;
  }) {
    const q = safeLabel(opts.queryName);
    const u = safeLabel(opts.userId);
    const s = safeLabel(opts.status);
    const db = safeLabel(opts.db);

    queryDurationSeconds
      .labels(q, u, s, db)
      .observe(Math.max(opts.durationMs, 0) / 1000);
    queryCount.labels(q, u, s, db).inc();
  }

  recordConnectionPoolStats(poolId: string, stats: { total: number; idle: number; waiting: number }) {
    const id = safeLabel(poolId);
    poolTotal.labels(id).set(stats.total);
    poolIdle.labels(id).set(stats.idle);
    poolWaiting.labels(id).set(stats.waiting);
  }

  recordUserActivity(userId: string, action: string) {
    userActivityCounter.labels(safeLabel(userId), safeLabel(action)).inc();
  }

  recordSystemHealth(metrics: { eventLoopLagMs?: number; memoryRssBytes?: number }) {
    if (typeof metrics.eventLoopLagMs === "number") {
      eventLoopLagMs.set(metrics.eventLoopLagMs);
    }
    if (typeof metrics.memoryRssBytes === "number") {
      memoryUsageBytes.set(metrics.memoryRssBytes);
    }
  }

  getRegister() {
    return register;
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;
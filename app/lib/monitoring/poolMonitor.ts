// Example connection pool monitor. Adapt to your pool implementation (pg, mysql, etc.)
import { metricsCollector } from "./metrics";

export function startPoolMonitor(opts: {
  getPoolStats: () => { poolId: string; total: number; idle: number; waiting: number }[];
  intervalMs?: number;
}) {
  const interval = opts.intervalMs ?? 5000;
  const timer = setInterval(() => {
    try {
      const all = opts.getPoolStats();
      for (const s of all) {
        metricsCollector.recordConnectionPoolStats(s.poolId, {
          total: s.total,
          idle: s.idle,
          waiting: s.waiting,
        });
      }
    } catch (err) {
      // swallow errors to avoid crash; optionally increment an internal error metric
      // console.error("pool monitor error", err);
    }
  }, interval).unref();

  return () => clearInterval(timer);
}
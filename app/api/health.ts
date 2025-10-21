// Lightweight liveness/readiness with basic system health checks
import express from "express";
import metricsCollector from "../lib/monitoring/metrics";
import os from "os";

const router = express.Router();

router.get("/health", async (req, res) => {
  // Basic checks: memory and event loop lag sample
  const mem = process.memoryUsage();
  // naive event loop lag measurement
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    metricsCollector.recordSystemHealth({ eventLoopLagMs: lag, memoryRssBytes: mem.rss });
  });

  // Add any DB pool checks or external service checks here and return non-200 when failing
  res.json({ status: "ok", memoryRss: mem.rss, cpus: os.cpus().length });
});

export default router;
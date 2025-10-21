// Example Express handler to expose metrics at /metrics
import express from "express";
import metricsCollector from "../lib/monitoring/metrics";

const router = express.Router();

router.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", metricsCollector.getRegister().contentType);
    const body = await metricsCollector.getRegister().metrics();
    res.send(body);
  } catch (err: unknown) {
    // Normalize unknown errors to a string message before sending
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to collect metrics';
    res.status(500).send(message);
  }
});

export default router;
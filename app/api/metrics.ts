// Example Express handler to expose metrics at /metrics
import express from "express";
import metricsCollector from "../lib/monitoring/metrics";

const router = express.Router();

router.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", metricsCollector.getRegister().contentType);
    const body = await metricsCollector.getRegister().metrics();
    res.send(body);
  } catch (err) {
    res.status(500).send(err.message || "Failed to collect metrics");
  }
});

export default router;
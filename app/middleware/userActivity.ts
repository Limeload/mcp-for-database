// Express middleware to track user actions. Call metricsCollector.recordUserActivity for operations too.
import { Request, Response, NextFunction } from "express";
import metricsCollector from "../lib/monitoring/metrics";

// Example: mark each HTTP request as a user action 'http_request' with method+path
export function userActivityMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const userId = (req as any).user?.id || "anonymous";
  res.on("finish", () => {
    const action = `http_${req.method.toLowerCase()}`;
    metricsCollector.recordUserActivity(String(userId), action);
    // optionally record request duration as a query-like metric
    const dur = Date.now() - start;
    metricsCollector.recordQueryExecution({
      queryName: `http_${req.method}_${req.route?.path || req.path}`,
      durationMs: dur,
      userId: String(userId),
      status: res.statusCode < 400 ? "success" : "error",
      db: "http",
    });
  });
  next();
}
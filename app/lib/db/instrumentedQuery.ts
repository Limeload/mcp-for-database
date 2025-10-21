// Wrap your DB query execution to record metrics.
// Example for pg Pool / any query function
import { metricsCollector } from "../monitoring/metrics";

export async function instrumentedQuery<T>(
  queryName: string,
  runQuery: () => Promise<T>,
  opts?: { userId?: string; db?: string }
): Promise<T> {
  const start = Date.now();
  try {
    const result = await runQuery();
    const dur = Date.now() - start;
    metricsCollector.recordQueryExecution({
      queryName,
      durationMs: dur,
      userId: opts?.userId,
      status: "success",
      db: opts?.db,
    });
    return result;
  } catch (err) {
    const dur = Date.now() - start;
    metricsCollector.recordQueryExecution({
      queryName,
      durationMs: dur,
      userId: opts?.userId,
      status: "error",
      db: opts?.db,
    });
    throw err;
  }
}
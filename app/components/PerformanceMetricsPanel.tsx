'use client';

import { PerformanceMetrics } from '@/app/types/database';

interface PerformanceMetricsPanelProps {
  metrics: PerformanceMetrics;
  isDarkMode: boolean;
}

export default function PerformanceMetricsPanel({ metrics, isDarkMode }: PerformanceMetricsPanelProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplexityColor = (score: number) => {
    if (score <= 2) return 'text-green-600 dark:text-green-400';
    if (score <= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 2) return 'Low';
    if (score <= 4) return 'Medium';
    return 'High';
  };

  const getPerformanceRating = (time: number) => {
    if (time < 100) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (time < 500) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (time < 2000) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Slow', color: 'text-red-600 dark:text-red-400' };
  };

  const performanceRating = getPerformanceRating(metrics.executionTime);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-blue-200 dark:border-gray-600 shadow-lg">
      <div className="flex items-center mb-6">
        <svg className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Performance Metrics</h3>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${performanceRating.color} bg-white dark:bg-gray-800 shadow-sm`}>
          {performanceRating.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Execution Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Execution Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.executionTime}ms</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Rows Affected */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rows Affected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.rowsAffected.toLocaleString()}</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.memoryUsage.toFixed(1)} MB</p>
              </div>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
        )}

        {/* CPU Usage */}
        {metrics.cpuUsage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.cpuUsage.toFixed(1)}%</p>
              </div>
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
        )}

        {/* Query Complexity */}
        {metrics.queryComplexityScore && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complexity Score</p>
                <p className={`text-2xl font-bold ${getComplexityColor(metrics.queryComplexityScore)}`}>
                  {metrics.queryComplexityScore}/10
                </p>
                <p className={`text-xs font-medium ${getComplexityColor(metrics.queryComplexityScore)}`}>
                  {getComplexityLabel(metrics.queryComplexityScore)}
                </p>
              </div>
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        )}

        {/* Data Processed */}
        {metrics.totalBytesProcessed && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Processed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBytes(metrics.totalBytesProcessed)}</p>
              </div>
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {(metrics.cacheHits !== undefined || metrics.networkLatency !== undefined) && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Additional Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.cacheHits !== undefined && metrics.cacheMisses !== undefined && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Performance</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">{metrics.cacheHits} hits</div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">{metrics.cacheMisses} misses</div>
                  </div>
                </div>
              </div>
            )}
            {metrics.networkLatency !== undefined && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Network Latency</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metrics.networkLatency.toFixed(1)}ms</span>
                </div>
              </div>
            )}
            {metrics.peakMemoryUsage && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Memory</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metrics.peakMemoryUsage.toFixed(1)} MB</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Optimization Suggestions
        </h4>
        <div className="space-y-2">
          {metrics.executionTime > 1000 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚡ Consider adding indexes on frequently queried columns to improve performance.
              </p>
            </div>
          )}
          {metrics.memoryUsage && metrics.memoryUsage > 100 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💾 High memory usage detected. Consider optimizing the query or increasing memory limits.
              </p>
            </div>
          )}
          {metrics.queryComplexityScore && metrics.queryComplexityScore > 7 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                🔴 Complex query detected. Consider breaking it into smaller queries or using stored procedures.
              </p>
            </div>
          )}
          {metrics.cacheMisses && metrics.cacheHits && (metrics.cacheMisses / (metrics.cacheHits + metrics.cacheMisses)) > 0.5 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                📊 Low cache hit rate. Consider adjusting cache configuration or query patterns.
              </p>
            </div>
          )}
          {(!metrics.executionTime || metrics.executionTime < 100) && (!metrics.memoryUsage || metrics.memoryUsage < 50) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Query performance looks good! No immediate optimizations needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
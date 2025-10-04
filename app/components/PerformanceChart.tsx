'use client';

import { PerformanceMetrics } from '@/app/types/database';

interface PerformanceChartProps {
  metrics: PerformanceMetrics[];
  isDarkMode: boolean;
}

export default function PerformanceChart({ metrics, isDarkMode }: PerformanceChartProps) {
  if (metrics.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No performance data to chart</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Run more queries to see trends</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and data
  const maxExecutionTime = Math.max(...metrics.map(m => m.executionTime));
  const maxMemoryUsage = Math.max(...metrics.filter(m => m.memoryUsage).map(m => m.memoryUsage || 0));
  const maxCpuUsage = Math.max(...metrics.filter(m => m.cpuUsage).map(m => m.cpuUsage || 0));

  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  const getPoint = (value: number, maxValue: number, index: number) => {
    const x = padding + (index / (metrics.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (value / maxValue) * (chartHeight - 2 * padding);
    return { x, y };
  };

  const executionTimePoints = metrics.map((m, i) => getPoint(m.executionTime, maxExecutionTime, i));
  const memoryPoints = metrics.filter(m => m.memoryUsage).map((m, i) => getPoint(m.memoryUsage || 0, maxMemoryUsage, i));
  const cpuPoints = metrics.filter(m => m.cpuUsage).map((m, i) => getPoint(m.cpuUsage || 0, maxCpuUsage, i));

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Trends</h3>

      <div className="space-y-6">
        {/* Execution Time Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Execution Time (ms)</h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Latest: {metrics[metrics.length - 1]?.executionTime}ms
            </span>
          </div>
          <div className="relative">
            <svg width={chartWidth} height={chartHeight} className="border border-gray-200 dark:border-gray-600 rounded">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Y-axis labels */}
              <text x="10" y={padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                {maxExecutionTime}
              </text>
              <text x="10" y={chartHeight - padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                0
              </text>

              {/* Chart line */}
              <path
                d={createPath(executionTimePoints)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {executionTimePoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all cursor-pointer"
                  title={`${metrics[i].executionTime}ms`}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Memory Usage Chart */}
        {memoryPoints.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Usage (MB)</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Latest: {metrics[metrics.length - 1]?.memoryUsage?.toFixed(1)} MB
              </span>
            </div>
            <div className="relative">
              <svg width={chartWidth} height={chartHeight} className="border border-gray-200 dark:border-gray-600 rounded">
                <defs>
                  <pattern id="grid2" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid2)" />

                <text x="10" y={padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                  {maxMemoryUsage.toFixed(0)}
                </text>
                <text x="10" y={chartHeight - padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                  0
                </text>

                <path
                  d={createPath(memoryPoints)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {memoryPoints.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#10b981"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* CPU Usage Chart */}
        {cpuPoints.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Usage (%)</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Latest: {metrics[metrics.length - 1]?.cpuUsage?.toFixed(1)}%
              </span>
            </div>
            <div className="relative">
              <svg width={chartWidth} height={chartHeight} className="border border-gray-200 dark:border-gray-600 rounded">
                <defs>
                  <pattern id="grid3" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid3)" />

                <text x="10" y={padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                  {maxCpuUsage.toFixed(0)}
                </text>
                <text x="10" y={chartHeight - padding} className="text-xs fill-gray-500 dark:fill-gray-400" textAnchor="middle">
                  0
                </text>

                <path
                  d={createPath(cpuPoints)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {cpuPoints.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#f59e0b"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Showing last {metrics.length} queries • Hover over points for details
      </div>
    </div>
  );
}
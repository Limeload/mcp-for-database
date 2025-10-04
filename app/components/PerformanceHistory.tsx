'use client';

import { useState, useEffect } from 'react';
import { PerformanceMetrics } from '@/app/types/database';
import PerformanceChart from './PerformanceChart';

interface PerformanceHistoryEntry {
  id: string;
  timestamp: number;
  query: string;
  metrics: PerformanceMetrics;
  target: string;
}

interface PerformanceHistoryProps {
  isDarkMode: boolean;
  onLoadMetrics?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceHistory({ isDarkMode, onLoadMetrics }: PerformanceHistoryProps) {
  const [history, setHistory] = useState<PerformanceHistoryEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'charts'>('history');

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('performanceHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (error) {
        console.error('Failed to parse performance history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('performanceHistory', JSON.stringify(history));
  }, [history]);

  const addToHistory = (query: string, metrics: PerformanceMetrics, target: string) => {
    const newEntry: PerformanceHistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      query: query.slice(0, 100) + (query.length > 100 ? '...' : ''), // Truncate long queries
      metrics,
      target
    };

    setHistory(prev => [newEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPerformanceColor = (time: number) => {
    if (time < 100) return 'text-green-600 dark:text-green-400';
    if (time < 500) return 'text-blue-600 dark:text-blue-400';
    if (time < 2000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Expose addToHistory function to parent components
  useEffect(() => {
    (window as any).addPerformanceHistory = addToHistory;
    return () => {
      delete (window as any).addPerformanceHistory;
    };
  }, []);

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No performance history yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Run some queries to see performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance Analytics
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === 'charts'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              Charts
            </button>
            <button
              onClick={clearHistory}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'history' ? (
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-48 overflow-hidden'}`}>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                          {entry.target}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-mono truncate">
                        {entry.query}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`font-semibold ${getPerformanceColor(entry.metrics.executionTime)}`}>
                          {entry.metrics.executionTime}ms
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {entry.metrics.rowsAffected} rows
                        </span>
                        {entry.metrics.memoryUsage && (
                          <span className="text-gray-600 dark:text-gray-400">
                            {entry.metrics.memoryUsage.toFixed(1)} MB
                          </span>
                        )}
                        {entry.metrics.cpuUsage && (
                          <span className="text-gray-600 dark:text-gray-400">
                            {entry.metrics.cpuUsage.toFixed(1)}% CPU
                          </span>
                        )}
                      </div>
                    </div>
                    {onLoadMetrics && (
                      <button
                        onClick={() => onLoadMetrics(entry.metrics)}
                        className="ml-4 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        title="Load these metrics"
                      >
                        Load
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!isExpanded && history.length > 3 && (
              <div className="p-3 bg-gradient-to-t from-gray-100 dark:from-gray-700 to-transparent text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Show all {history.length} entries
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <PerformanceChart
              metrics={history.map(entry => entry.metrics)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    );
  }
}
export const addToPerformanceHistory = (query: string, metrics: PerformanceMetrics, target: string) => {
  if (typeof window !== 'undefined' && (window as any).addPerformanceHistory) {
    (window as any).addPerformanceHistory(query, metrics, target);
  }
};
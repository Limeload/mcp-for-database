'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseTarget, DatabaseQueryResponse, ConnectionPoolStats } from '@/app/types/database';

/**
 * Enhanced DbConsole Component with Connection Pool Management
 * Features:
 * - Natural language prompt input
 * - Database target selection (SQLAlchemy or Snowflake)
 * - Connection reuse and management
 * - Query submission with loading states
 * - Results display in a styled table
 * - Error handling and user feedback
 * - Dark mode toggle functionality
 * - Connection pool statistics
 * - Manual connection cleanup
 */
export default function DbConsole() {
  const [prompt, setPrompt] = useState('');
  const [target, setTarget] = useState<DatabaseTarget>('sqlalchemy');
  const [connectionId, setConnectionId] = useState('');
  const [reuseConnection, setReuseConnection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionPoolStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const shouldBeDark =
      savedTheme === 'true' || (savedTheme === null && prefersDark);
    setIsDarkMode(shouldBeDark);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Load connection stats on mount and periodically
  useEffect(() => {
    loadConnectionStats();
    const interval = setInterval(loadConnectionStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadConnectionStats = async () => {
    try {
      const response = await fetch('/api/db/query');
      if (response.ok) {
        const stats = await response.json();
        setConnectionStats(stats);
      }
    } catch (err) {
      console.error('Failed to load connection stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody = {
        prompt: prompt.trim(),
        target,
        ...(reuseConnection && connectionId && { connectionId }),
        maxExecutionTime: 30000
      };

      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data: DatabaseQueryResponse = await response.json();

      if (data.success) {
        setResult(data);
        // Update connection ID for reuse
        if (data.connectionId) {
          setConnectionId(data.connectionId);
        }
        // Refresh connection stats
        loadConnectionStats();
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupConnections = async () => {
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'cleanup_idle_connections',
            arguments: {}
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const cleanupResult = JSON.parse(result.content[0].text);
        alert(`Cleaned up ${cleanupResult.cleanedConnections} idle connections`);
        loadConnectionStats();
      }
    } catch (err) {
      console.error('Failed to cleanup connections:', err);
      alert('Failed to cleanup connections');
    }
  };

  const renderTableHeaders = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);
    return (
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          {headers.map(header => (
            <th
              key={header}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  const renderTableRows = (data: any[]) => {
    if (!data || data.length === 0) return null;

    return (
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={
              rowIndex % 2 === 0
                ? 'bg-white dark:bg-gray-800'
                : 'bg-gray-50 dark:bg-gray-700'
            }
          >
            {Object.values(row).map((value, cellIndex) => (
              <td
                key={cellIndex}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
              >
                {String(value)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Stats Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Database Console
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Execute database queries using natural language with connection pooling
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>

        {/* Connection Pool Statistics */}
        {showStats && connectionStats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Connection Pool Statistics
              </h2>
              <button
                onClick={handleCleanupConnections}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Cleanup Idle
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {connectionStats.totalConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {connectionStats.activeConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {connectionStats.idleConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Idle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {connectionStats.totalQueries}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Queries</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Average Query Time: {connectionStats.averageQueryTime.toFixed(2)}ms
            </div>
          </div>
        )}

        {/* Query Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Database Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Database Target
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="sqlalchemy"
                      checked={target === 'sqlalchemy'}
                      onChange={(e) => setTarget(e.target.value as DatabaseTarget)}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">SQLAlchemy</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="snowflake"
                      checked={target === 'snowflake'}
                      onChange={(e) => setTarget(e.target.value as DatabaseTarget)}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Snowflake</span>
                  </label>
                </div>
              </div>

              {/* Connection Management */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reuseConnection}
                    onChange={(e) => setReuseConnection(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Reuse existing connection
                  </span>
                </label>
                {reuseConnection && (
                  <input
                    type="text"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
                    placeholder="Connection ID (leave empty for auto)"
                    className="mt-2 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Natural Language Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Show me all users from the database..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Executing Query...
                  </div>
                ) : (
                  'Execute Query'
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="px-6 pb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400 dark:text-red-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Results */}
          {result && result.success && (
            <div className="px-6 pb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400 dark:text-green-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Query executed successfully
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <div>Execution time: {result.executionTime}ms</div>
                      {result.connectionId && (
                        <div>Connection ID: {result.connectionId}</div>
                      )}
                      {result.activeConnections !== undefined && (
                        <div>Active connections: {result.activeConnections}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Query */}
              {result.query && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated SQL Query:
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                    <code>{result.query}</code>
                  </pre>
                </div>
              )}

              {/* Results Table */}
              {result.data && result.data.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Results ({result.data.length} rows):
                  </h4>
                  <div className="overflow-x-auto shadow ring-1 ring-black dark:ring-white ring-opacity-5 dark:ring-opacity-10 rounded-md">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      {renderTableHeaders(result.data)}
                      {renderTableRows(result.data)}
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data returned from query
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

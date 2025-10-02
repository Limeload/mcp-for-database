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
 * - Real-time connection monitoring
 */
export default function DbConsole() {
  // Core state
  const [prompt, setPrompt] = useState('');
  const [target, setTarget] = useState<DatabaseTarget>('sqlalchemy');
  const [connectionId, setConnectionId] = useState('');
  const [reuseConnection, setReuseConnection] = useState(false);
  const [maxExecutionTime, setMaxExecutionTime] = useState(30000);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Connection management state
  const [connectionStats, setConnectionStats] = useState<ConnectionPoolStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [autoRefreshStats, setAutoRefreshStats] = useState(true);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'true' || (savedTheme === null && prefersDark);
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

  // Load connection stats on mount and set up auto-refresh
  useEffect(() => {
    loadConnectionStats();
    
    let interval: NodeJS.Timeout;
    if (autoRefreshStats) {
      interval = setInterval(loadConnectionStats, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshStats]);

  /**
   * Load connection pool statistics
   */
  const loadConnectionStats = async () => {
    try {
      const response = await fetch('/api/db/query', {
        method: 'GET'
      });
      if (response.ok) {
        const stats = await response.json();
        setConnectionStats(stats);
      }
    } catch (err) {
      console.error('Failed to load connection stats:', err);
    }
  };

  /**
   * Handle form submission for query execution
   */
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
        maxExecutionTime
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

  /**
   * Handle manual connection cleanup
   */
  const handleCleanupConnections = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetch('/mcp', {
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
        
        // Show success message
        const message = `Successfully cleaned up ${cleanupResult.cleanedConnections} idle connections`;
        setError(null);
        
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
        
        loadConnectionStats();
      }
    } catch (err) {
      console.error('Failed to cleanup connections:', err);
      setError('Failed to cleanup connections');
    } finally {
      setIsCleaningUp(false);
    }
  };

  /**
   * Handle closing a specific connection
   */
  const handleCloseConnection = async (connId: string) => {
    try {
      const response = await fetch(`/api/db/connection?connectionId=${connId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          loadConnectionStats();
          // Clear the connection ID if it matches the closed one
          if (connectionId === connId) {
            setConnectionId('');
          }
        }
      }
    } catch (err) {
      console.error('Failed to close connection:', err);
    }
  };

  /**
   * Clear current query and reset form
   */
  const handleClearQuery = () => {
    setPrompt('');
    setResult(null);
    setError(null);
  };

  /**
   * Toggle between SQLAlchemy and Snowflake
   */
  const handleTargetToggle = () => {
    setTarget(target === 'sqlalchemy' ? 'snowflake' : 'sqlalchemy');
  };

  /**
   * Render table headers from the first row of data
   */
  const renderTableHeaders = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);
    return (
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          {headers.map(header => (
            <th
              key={header}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  /**
   * Render table rows with data
   */
  const renderTableRows = (data: any[]) => {
    if (!data || data.length === 0) return null;

    return (
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={
              rowIndex % 2 === 0
                ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650'
            }
          >
            {Object.values(row).map((value, cellIndex) => (
              <td
                key={cellIndex}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600"
              >
                {value === null ? (
                  <span className="text-gray-400 italic">null</span>
                ) : value === undefined ? (
                  <span className="text-gray-400 italic">undefined</span>
                ) : (
                  String(value)
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Database Console
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Execute database queries using natural language with connection pooling
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Logged in as: <span className="font-medium">rohitstu8595</span> • {new Date().toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefreshStats(!autoRefreshStats)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                autoRefreshStats
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {autoRefreshStats ? '🔄 Auto-refresh' : '⏸️ Paused'}
            </button>
            
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Toggle dark mode"
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>

        {/* Connection Pool Statistics */}
        {showStats && connectionStats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
                Connection Pool Statistics
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={loadConnectionStats}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  disabled={isCleaningUp}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={handleCleanupConnections}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                  disabled={isCleaningUp}
                >
                  {isCleaningUp ? '🧹 Cleaning...' : '🧹 Cleanup Idle'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {connectionStats.totalConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {connectionStats.activeConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {connectionStats.idleConnections}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Idle</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {connectionStats.totalQueries}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Queries</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {connectionStats.averageQueryTime.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Avg Time (ms)</div>
              </div>
              <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                  {Object.keys(connectionStats.connectionsByTarget).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Targets</div>
              </div>
            </div>
            
            {Object.keys(connectionStats.connectionsByTarget).length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Connections by Target
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(connectionStats.connectionsByTarget).map(([target, count]) => (
                    <div
                      key={target}
                      className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
                    >
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {target}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Query Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Query Interface
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Enter your natural language query to interact with the database
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Database Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Database Target
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="sqlalchemy"
                      checked={target === 'sqlalchemy'}
                      onChange={(e) => setTarget(e.target.value as DatabaseTarget)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium">
                      SQLAlchemy
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="snowflake"
                      checked={target === 'snowflake'}
                      onChange={(e) => setTarget(e.target.value as DatabaseTarget)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium">
                      Snowflake
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTargetToggle}
                    className="ml-4 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* Connection Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reuseConnection}
                      onChange={(e) => setReuseConnection(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Reuse existing connection
                    </span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                  </button>
                </div>
                
                {reuseConnection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Connection ID
                    </label>
                    <input
                      type="text"
                      value={connectionId}
                      onChange={(e) => setConnectionId(e.target.value)}
                      placeholder="Leave empty for auto-assignment"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    {connectionId && (
                      <button
                        type="button"
                        onClick={() => setConnectionId('')}
                        className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear Connection ID
                      </button>
                    )}
                  </div>
                )}
                
                {showAdvanced && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Execution Time (ms)
                    </label>
                    <input
                      type="number"
                      value={maxExecutionTime}
                      onChange={(e) => setMaxExecutionTime(Number(e.target.value))}
                      min="1000"
                      max="300000"
                      step="1000"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Query timeout in milliseconds (1000-300000)
                    </p>
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Natural Language Prompt
                  </label>
                  {prompt && (
                    <button
                      type="button"
                      onClick={handleClearQuery}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Show me all users who registered in the last 30 days, or Count the number of orders by status"
                  rows={4}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {prompt.length} characters
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrompt("Show me all users from the database")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Sample Query
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    <span>Executing Query...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Execute Query</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="px-6 pb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
                      Query Error
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
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
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
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                      <div>⚡ Execution time: {result.executionTime}ms</div>
                      {result.connectionId && (
                        <div className="flex items-center space-x-2">
                          <span>🔗 Connection ID: {result.connectionId}</span>
                          <button
                            onClick={() => result.connectionId && handleCloseConnection(result.connectionId)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Close
                          </button>
                        </div>
                      )}
                      {result.activeConnections !== undefined && (
                        <div>📊 Active connections: {result.activeConnections}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Query */}
              {result.query && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Generated SQL Query:
                  </h4>
                  <div className="relative">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                      <code>{result.query}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.query || '')}
                      className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}

              {/* Results Table */}
              {result.data && result.data.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Results ({result.data.length} rows):
                    </h4>
                    <button
                      onClick={() => {
                        const csv = [
                          Object.keys(result.data![0]).join(','),
                          ...result.data!.map(row => Object.values(row).join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'query-results.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto shadow ring-1 ring-black dark:ring-white ring-opacity-5 dark:ring-opacity-10 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      {renderTableHeaders(result.data)}
                      {renderTableRows(result.data)}
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-lg font-medium">No data returned</div>
                  <div className="text-sm">The query executed successfully but returned no results</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

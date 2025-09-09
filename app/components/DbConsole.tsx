'use client';

import { useState } from 'react';
import { DatabaseTarget, DatabaseQueryResponse } from '@/app/types/database';

/**
 * DbConsole Component
 * A reusable component for database query interface
 * Features:
 * - Natural language prompt input
 * - Database target selection (SQLAlchemy or Snowflake)
 * - Query submission with loading states
 * - Results display in a styled table
 * - Error handling and user feedback
 */
export default function DbConsole() {
  const [prompt, setPrompt] = useState('');
  const [target, setTarget] = useState<DatabaseTarget>('sqlalchemy');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   * Calls the API route to execute database query
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
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          target,
        }),
      });

      const data: DatabaseQueryResponse = await response.json();

      if (data.success) {
        setResult(data);
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
   * Render table headers from the first row of data
   */
  const renderTableHeaders = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const firstRow = data[0];
    const headers = Object.keys(firstRow);
    
    return (
      <thead className="bg-gray-50">
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {Object.values(row).map((value, cellIndex) => (
              <td
                key={cellIndex}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Database Console</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enter a natural language prompt to query your database
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Natural Language Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Show me all users who registered in the last 30 days"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Target Selection */}
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
              Database Target
            </label>
            <select
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value as DatabaseTarget)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="sqlalchemy">SQLAlchemy</option>
              <option value="snowflake">Snowflake</option>
            </select>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && result.success && (
          <div className="px-6 pb-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Query Executed Successfully</h3>
                  <div className="mt-2 text-sm text-green-700">
                    {result.executionTime && `Execution time: ${result.executionTime}ms`}
                  </div>
                </div>
              </div>
            </div>

            {/* Query Display */}
            {result.query && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Query:</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                  <code>{result.query}</code>
                </pre>
              </div>
            )}

            {/* Results Table */}
            {result.data && result.data.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Results ({result.data.length} rows):
                </h4>
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-md">
                  <table className="min-w-full divide-y divide-gray-300">
                    {renderTableHeaders(result.data)}
                    {renderTableRows(result.data)}
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data returned from query
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

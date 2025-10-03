'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DatabaseTarget, DatabaseQueryResponse } from '@/app/types/database';
import {
  validateQuery,
  quickValidate,
  getExampleQueries,
  ValidationResult
} from '@/app/utils/queryValidation';

/**
 * DbConsole Component
 * A reusable component for database query interface
 * Features:
 * - Natural language prompt input
 * - Real-time query validation with suggestions
 * - Database target selection (SQLAlchemy or Snowflake)
 * - Query submission with loading states
 * - Results display in a styled table
 * - Error handling and user feedback
 * - Dark mode toggle functionality
 */
export default function DbConsole() {
  const [prompt, setPrompt] = useState('');
  const [target, setTarget] = useState<DatabaseTarget>('sqlalchemy');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Validation states
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const shouldBeDark =
      savedTheme === 'true' || (savedTheme === null && prefersDark);

    setIsDarkMode(shouldBeDark);
    document.body.classList.toggle('dark-mode', shouldBeDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  /**
   * Validate query in real-time
   * Debounced to avoid excessive validation calls
   */
  const validatePrompt = useCallback((value: string) => {
    if (!value.trim()) {
      setValidation(null);
      setShowValidation(false);
      return;
    }

    const validationResult = validateQuery(value);
    setValidation(validationResult);
    setShowValidation(true);
  }, []);

  /**
   * Handle prompt change with real-time validation
   */
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    // Validate after a short delay (debounce)
    const timeoutId = setTimeout(() => validatePrompt(value), 300);
    return () => clearTimeout(timeoutId);
  };

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

    // Perform quick validation before submission
    const quickCheck = quickValidate(prompt);
    if (!quickCheck.isValid) {
      setError(quickCheck.error || 'Query validation failed');
      return;
    }

    // Perform full validation
    const fullValidation = validateQuery(prompt);
    if (!fullValidation.isValid) {
      setError(fullValidation.errors[0]?.message || 'Query validation failed');
      setValidation(fullValidation);
      setShowValidation(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowValidation(false);

    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          target
        })
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
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
      {/* Dark Mode Toggle Button */}
      <button onClick={toggleDarkMode} className="dark-mode-toggle">
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Database Console
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Enter a natural language prompt to query your database
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Prompt Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Natural Language Prompt
                </label>
                <button
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showExamples ? 'Hide' : 'Show'} Examples
                </button>
              </div>
              
              <textarea
                id="prompt"
                value={prompt}
                onChange={e => handlePromptChange(e.target.value)}
                placeholder="e.g., Show me all users who registered in the last 30 days"
                className="w-4/5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                rows={3}
                disabled={isLoading}
              />

              {/* Example Queries Dropdown */}
              {showExamples && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Example Queries:
                  </p>
                  <ul className="space-y-1">
                    {getExampleQueries().slice(0, 5).map((example, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => {
                            setPrompt(example);
                            handlePromptChange(example);
                            setShowExamples(false);
                          }}
                          className="text-sm text-left text-blue-700 dark:text-blue-300 hover:underline w-full"
                        >
                          • {example}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-time Validation Feedback */}
              {showValidation && validation && prompt.trim() && (
                <div className="mt-3 space-y-2">
                  {/* Validation Status Indicator */}
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <>
                        <svg
                          className="h-5 w-5 text-green-500"
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
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Query looks good!
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5 text-red-500"
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
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                          Query needs improvement
                        </span>
                      </>
                    )}
                  </div>

                  {/* Validation Errors */}
                  {validation.errors.length > 0 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                        Errors:
                      </p>
                      <ul className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <li
                            key={index}
                            className="text-xs text-red-700 dark:text-red-300"
                          >
                            • {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Warnings */}
                  {validation.warnings.length > 0 && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Warnings:
                      </p>
                      <ul className="space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li
                            key={index}
                            className="text-xs text-yellow-700 dark:text-yellow-300"
                          >
                            • {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {validation.suggestions.length > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        💡 Suggestions:
                      </p>
                      <ul className="space-y-1">
                        {validation.suggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index} className="text-xs">
                            <p className="text-blue-700 dark:text-blue-300">
                              • {suggestion.message}
                            </p>
                            {suggestion.example && (
                              <p className="text-blue-600 dark:text-blue-400 ml-3 mt-0.5 italic">
                                Example: "{suggestion.example}"
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target Selection */}
            <div>
              <label
                htmlFor="target"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Database Target
              </label>
              <select
                id="target"
                value={target}
                onChange={e => setTarget(e.target.value as DatabaseTarget)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
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
                disabled={
                  isLoading ||
                  !prompt.trim() ||
                  (validation !== null && !validation.isValid)
                }
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
                ) : validation && !validation.isValid ? (
                  'Fix errors to execute'
                ) : (
                  'Execute Query'
                )}
              </button>
              {validation && !validation.isValid && prompt.trim() && (
                <p className="mt-2 text-xs text-center text-red-600 dark:text-red-400">
                  Please fix validation errors before executing the query
                </p>
              )}
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

          {/* Results Display */}
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
                      Query Executed Successfully
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      {result.executionTime &&
                        `Execution time: ${result.executionTime}ms`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Display */}
              {result.query && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated Query:
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

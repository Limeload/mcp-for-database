'use client';
import React, { useRef, useState, useEffect } from "react";
import { useKeyboardShortcuts } from "../hooks/KeyBoardShortcuts";
import { createShortcuts } from "../config/shortcuts";
import { DatabaseTarget, DatabaseQueryResponse, SchemaMetadata, TableMetadata, ColumnMetadata, IndexMetadata, RelationshipMetadata } from "@/app/types/database";

import {
  exportToCSV,
  exportToJSON,
  copyToClipboard,
  ExportData
} from '@/app/utils/exportUtils';
import { queryTemplates, QueryTemplate } from '@/app/config/templates';

type EnhancedError = {
  error: string;
  details?: string;
  suggestion?: string;
};

/**
 * DbConsole Component
 * A reusable component for database query interface
 * Features:
 * - Natural language prompt input
 * - Database target selection (SQLAlchemy, Snowflake, or SQLite)
 * - Query submission with loading states
 * - Results display in a styled table
 * - Error handling and user feedback
 * - Dark mode toggle functionality
 * - Schema viewing functionality
 */
export default function DbConsole() {
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState<DatabaseTarget>("sqlalchemy");
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<QueryTemplate | null>(null);
  // Placeholder values state
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  // Reset placeholder values when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const initial: Record<string, string> = {};
      selectedTemplate.placeholders.forEach((ph: string) => {
        initial[ph] = '';
      });
      setPlaceholderValues(initial);
    } else {
      setPlaceholderValues({});
    }
  }, [selectedTemplate]);
  // Update selected template when dropdown changes
  useEffect(() => {
    if (selectedTemplateId) {
      const found =
        queryTemplates.find(t => t.id === selectedTemplateId) || null;
      setSelectedTemplate(found);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DatabaseQueryResponse | null>(null);
  const [error, setError] = useState<EnhancedError | string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [schema, setSchema] = useState<SchemaMetadata | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | {
    success: boolean;
    message?: string;
    error?: string;
    diagnostics?: { [k: string]: unknown } | null;
  }>(null);

  // Schema view state for expand/collapse functionality
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [schemaSearchTerm, setSchemaSearchTerm] = useState('');

  const queryInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Load dark mode preference on mount
  // Export state
  const [copySuccess, setCopySuccess] = useState(false);
  // Typed diagnostics helper to safely render unknown diagnostics
  const currentDiag: Record<string, unknown> | undefined =
    connectionStatus &&
    connectionStatus.diagnostics &&
    typeof connectionStatus.diagnostics === 'object'
      ? (connectionStatus.diagnostics as Record<string, unknown>)
      : undefined;

  // Apply theme to document body
  const applyTheme = (currentTheme: 'light' | 'dark') => {
    // Remove existing theme classes
    document.body.classList.remove('light-mode', 'dark-mode');
    if (currentTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.add('dark-mode');
    }
  };

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const currentTheme: 'light' | 'dark' =
      savedTheme === 'dark' ? 'dark' : 'light';
    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  // Toggle between light <-> dark
  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError({ error: 'Please enter a prompt' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), target })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setResult({
          success: true,
          data: data.data,
          query: data.metadata?.query,
          executionTime: data.metadata?.executionTime
        });
      } else {
        setError(data.error?.message || 'An error occurred');
      }
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle schema fetching
   * Calls the API route to fetch database schema metadata
   */
  const handleFetchSchema = async () => {
    setIsLoadingSchema(true);
    setError(null);

    try {
      const response = await fetch(`/api/schema?target=${target}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSchema(data.data);
        setShowSchema(true);
        // Expand all tables by default
        setExpandedTables(
          new Set(data.data.tables.map((_: unknown, index: number) => index))
        );
      } else {
        setError(data.error?.message || 'Failed to fetch schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  /**
   * Toggle table expansion
   */
  const toggleTableExpansion = (tableIndex: number) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableIndex)) {
      newExpanded.delete(tableIndex);
    } else {
      newExpanded.add(tableIndex);
    }
    setExpandedTables(newExpanded);
  };

  /**
   * Toggle all tables expansion
   */
  const toggleAllTablesExpansion = () => {
    if (expandedTables.size === schema?.tables.length) {
      setExpandedTables(new Set());
    } else {
      setExpandedTables(new Set(schema?.tables.map((_: unknown, index: number) => index) || []));
    }
  };

  /**
   * Filter tables based on search term
   */
  const getFilteredTables = () => {
    if (!schema || !schemaSearchTerm.trim()) return schema?.tables || [];

    const searchLower = schemaSearchTerm.toLowerCase();
    return schema.tables.filter(
      (table: TableMetadata) =>
        table.name.toLowerCase().includes(searchLower) ||
        table.schema.toLowerCase().includes(searchLower) ||
        table.description?.toLowerCase().includes(searchLower) ||
        table.columns.some((col: ColumnMetadata) => col.name.toLowerCase().includes(searchLower))
    );
  };

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    if (!result?.data || result.data.length === 0) return;

    try {
      const exportData: ExportData = {
        data: result.data,
        query: result.query,
        executionTime: result.executionTime
      };
      const timestamp = new Date().toISOString().split('T')[0];
      exportToCSV(exportData, `query-results-${timestamp}.csv`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  /**
   * Handle export to JSON
   */
  const handleExportJSON = () => {
    if (!result?.data || result.data.length === 0) return;

    try {
      const exportData: ExportData = {
        data: result.data,
        query: result.query,
        executionTime: result.executionTime
      };
      const timestamp = new Date().toISOString().split('T')[0];
      exportToJSON(exportData, `query-results-${timestamp}.json`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed');
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!result?.data || result.data.length === 0) return;

    try {
      const exportData: ExportData = {
        data: result.data,
        query: result.query,
        executionTime: result.executionTime
      };
      const success = await copyToClipboard(exportData);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        setError('Failed to copy to clipboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Copy failed');
    }
  };

  /**
   * Render schema tables in a modern, structured format with hide/show functionality
   */
  const renderSchema = () => {
    if (!schema) return null;

    const filteredTables = getFilteredTables();
    const allExpanded = expandedTables.size === filteredTables.length;

    return (
      <div className="mt-8 space-y-6">
        {/* Schema Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl p-6 border border-indigo-200 dark:border-gray-600 shadow-lg">
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9h6v6H9z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Database Schema
                </h3>
                <p className="text-lg text-indigo-700 dark:text-indigo-300 font-medium">
                  {target.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Schema Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Tables</div>
                  <div className="text-2xl font-bold">{schema.totalTables}</div>
                </div>
                <svg
                  className="w-8 h-8 opacity-80"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Columns</div>
                  <div className="text-2xl font-bold">
                    {schema.totalColumns}
                  </div>
                </div>
                <svg
                  className="w-8 h-8 opacity-80"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Schemas</div>
                  <div className="text-2xl font-bold">
                    {schema.schemas.length}
                  </div>
                </div>
                <svg
                  className="w-8 h-8 opacity-80"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Search and Control Bar */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tables, columns, schemas..."
                  value={schemaSearchTerm}
                  onChange={e => setSchemaSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleAllTablesExpansion}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 min-h-[44px] touch-manipulation flex-1 sm:flex-initial"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={allExpanded ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
                    />
                  </svg>
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
                <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  {filteredTables.length}{' '}
                  {filteredTables.length === 1 ? 'table' : 'tables'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables List */}
        <div className="space-y-4">
          {filteredTables.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Tables Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            filteredTables.map(table => {
              const originalIndex = schema.tables.findIndex(
                t => t.name === table.name && t.schema === table.schema
              );
              const isExpanded = expandedTables.has(originalIndex);

              return (
                <div
                  key={originalIndex}
                  className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl"
                >
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleTableExpansion(originalIndex)}
                          className="group p-2 rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 transition-all duration-200 hover:scale-105 shadow-sm"
                        >
                          <svg
                            className={`w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {table.schema}.{table.name}
                          </h4>
                          {table.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {table.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${table.type === 'table' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}
                        >
                          {table.type.toUpperCase()}
                        </span>
                        {table.rowCount && (
                          <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-xs font-medium">
                            {table.rowCount.toLocaleString()} rows
                          </span>
                        )}
                        <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                          {table.columns.length} columns
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table Content */}
                  {isExpanded && (
                    <div className="animate-fade-in">
                      <div className="px-6 py-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                                  Column
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                                  Type
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                                  Constraints
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {table.columns.map((column: ColumnMetadata, colIndex: number) => (
                                <tr
                                  key={colIndex}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150"
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-3">
                                      <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">
                                        {column.name}
                                      </span>
                                      {column.isPrimaryKey && (
                                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-md text-xs font-semibold">
                                          PK
                                        </span>
                                      )}
                                      {column.isForeignKey && (
                                        <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-md text-xs font-semibold">
                                          FK
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                      {column.dataType}
                                      {column.maxLength &&
                                        `(${column.maxLength})`}
                                      {column.precision &&
                                        column.scale !== undefined &&
                                        `(${column.precision},${column.scale})`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                      {!column.isNullable && (
                                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md text-xs font-medium">
                                          NOT NULL
                                        </span>
                                      )}
                                      {column.defaultValue && (
                                        <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs font-medium">
                                          DEFAULT
                                        </span>
                                      )}
                                      {column.constraints.map(
                                        (constraint: string, constraintIndex: number) => (
                                          <span
                                            key={constraintIndex}
                                            className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-md text-xs font-medium"
                                          >
                                            {constraint}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Indexes */}
                        {table.indexes.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v 6a2 2 0 002 2h6a2 2 0 002 2v6m0 0V9a2 2 0 012 2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002 2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              Indexes ({table.indexes.length})
                            </h5>
                            <div className="space-y-2">
                              {table.indexes.map((index: IndexMetadata, indexIndex: number) => (
                                <div
                                  key={indexIndex}
                                  className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                      {index.name}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                        {index.columns.join(', ')}
                                      </span>
                                      {index.isUnique && (
                                        <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-md text-xs font-semibold">
                                          UNIQUE
                                        </span>
                                      )}
                                      <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs">
                                        {index.type}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Relationships */}
        {schema.relationships.length > 0 && (
          <div className="bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-lg p-6">
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Database Relationships ({schema.relationships.length})
            </h4>
            <div className="space-y-3">
              {schema.relationships.map((rel: RelationshipMetadata, index: number) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-mono text-sm font-semibold text-purple-800 dark:text-purple-200">
                          {rel.fromTable}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          {rel.fromColumns.join(', ')}
                        </div>
                      </div>
                      <svg
                        className="w-6 h-6 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <div className="text-center">
                        <div className="font-mono text-sm font-semibold text-purple-800 dark:text-purple-200">
                          {rel.toTable}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          {rel.toColumns.join(', ')}
                        </div>
                      </div>
                    </div>
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg text-sm font-semibold">
                      {rel.type
                        .replace('-', ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {rel.constraintName && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-100/50 dark:bg-purple-900/30 px-2 py-1 rounded">
                      Constraint: {rel.constraintName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schema Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Schema version:{' '}
              <span className="font-mono font-semibold">{schema.version}</span>
            </div>
            <div>
              Last updated:{' '}
              <span className="font-mono">
                {new Date(schema.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render table headers from the first row of data
   */
  const renderTableHeaders = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);
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
  const renderTableRows = (data: Record<string, unknown>[]) => {
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

  // Concrete behaviors used by shortcuts
  const executeQuery = async () => {
    const q = prompt.trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, target }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as DatabaseQueryResponse;
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setPrompt("");
    setError(null);
    setResult(null);
    queryInputRef.current?.focus();
  };

  const focusInput = () => {
    queryInputRef.current?.focus();
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);

    // Tailwind with darkMode: 'class' expects the 'dark' class on <html>
    document.documentElement.classList.toggle("dark", next);

    // also toggle on body to support any non-tailwind global rules
    document.body.classList.toggle("dark", next);

    try {
      localStorage.setItem("darkMode", next ? "1" : "0");
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to persist darkMode', e);
      }
    }
  };

  useEffect(() => {
    // restore preference on mount
    try {
      const pref = localStorage.getItem("darkMode");
      const shouldDark = pref === "1";
      setIsDarkMode(shouldDark);
      document.documentElement.classList.toggle("dark", shouldDark);
      document.body.classList.toggle("dark", shouldDark);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to read darkMode', e);
      }
    }
  }, []);

  const exportResults = () => {
    if (!result || !Array.isArray((result as { data?: Record<string, unknown>[] }).data)) return;
    const rows = (result.data ?? []) as Record<string, unknown>[];
    const csv = convertToCSV(rows);
    downloadCSV(csv, "query-results.csv");
  };

  // Create shortcuts using handlers defined above
  const shortcuts = createShortcuts({
    executeQuery,
    clearForm,
    focusInput,
    toggleDarkMode,
    exportResults,
  });

  // Register global keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // Example: restore dark mode preference on mount
  useEffect(() => {
    try {
      const pref = localStorage.getItem("darkMode");
      if (pref === "1") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to read darkMode', e);
      }
    }
  }, []);

  return (
    <>
      {/* Theme Toggle Button - Mobile Optimized */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 sm:p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={`Current theme: ${theme}. Click to toggle`}
        title={`Current: ${theme === 'light' ? 'Light' : 'Dark'} mode`}
      >
        {theme === 'light' ? (
          // Light mode icon (sun)
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Dark mode icon (moon)
          <svg
            className="w-5 h-5 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg sm:rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 mt-1 sm:mt-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Database Console
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Query your database using natural language prompts powered by
                  the Model Context Protocol
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Query Template Selection */}
              <div className="md:col-span-2 mb-2">
                <label
                  htmlFor="template-select"
                  className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
                >
                  Select a Query Template
                </label>
                <select
                  id="template-select"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 sm:py-2 mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base min-h-[44px]"
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- None --</option>
                  {queryTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedTemplate.description}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-mono">
                        {selectedTemplate.defaultPrompt}
                      </span>
                    </div>
                    {/* Render placeholder input fields if any */}
                    {selectedTemplate.placeholders.length > 0 && (
                      <div className="mt-4">
                        <div className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                          Fill in template variables:
                        </div>
                        <div className="flex flex-col gap-2">
                          {selectedTemplate.placeholders.map(ph => (
                            <div key={ph} className="flex items-center gap-2">
                              <label
                                htmlFor={`ph-${ph}`}
                                className="w-32 text-gray-700 dark:text-gray-300 font-medium"
                              >
                                {ph}
                              </label>
                              <input
                                id={`ph-${ph}`}
                                type="text"
                                className="flex-1 px-3 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                value={placeholderValues[ph] || ''}
                                onChange={e =>
                                  setPlaceholderValues(v => ({
                                    ...v,
                                    [ph]: e.target.value
                                  }))
                                }
                                placeholder={`Enter ${ph}`}
                              />
                            </div>
                          ))}
                        </div>
                        {/* Insert Template Button */}
                        <button
                          type="button"
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50"
                          onClick={() => {
                            // Validate all placeholders are filled
                            const missing =
                              selectedTemplate.placeholders.filter(
                                ph => !placeholderValues[ph]?.trim()
                              );
                            if (missing.length > 0) {
                              setError(`Please fill in: ${missing.join(', ')}`);
                              return;
                            }
                            // Replace placeholders in prompt
                            let builtPrompt = selectedTemplate.defaultPrompt;
                            selectedTemplate.placeholders.forEach(ph => {
                              const re = new RegExp(
                                '{{\\s*' + ph + '\\s*}}',
                                'g'
                              );
                              builtPrompt = builtPrompt.replace(
                                re,
                                placeholderValues[ph]
                              );
                            });
                            setPrompt(builtPrompt);
                            setError(null);
                          }}
                          disabled={selectedTemplate.placeholders.some(
                            ph => !placeholderValues[ph]?.trim()
                          )}
                        >
                          Use Template
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Prompt Input */}
              <div className="md:col-span-2">
                <label
                  htmlFor="prompt"
                  className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Natural Language Prompt
                </label>
                <textarea
                  id="prompt"
                  ref={queryInputRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g., Show me all users who registered in the last 30 days, or Get the total sales for this month..."
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 resize-none text-base leading-relaxed"
                  rows={4}
                  disabled={isLoading}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Describe what you want to know in plain English
                </p>
              </div>

              {/* Target Selection */}
              <div>
                <label
                  htmlFor="target"
                  className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9h6v6H9z"
                    />
                  </svg>
                  Database Target
                </label>
                <select
                  id="target"
                  value={target}
                  onChange={e => setTarget(e.target.value as DatabaseTarget)}
                  className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-base min-h-[44px]"
                  disabled={isLoading}
                >
                  <option value="sqlalchemy">SQLAlchemy (Python ORM)</option>
                  <option value="snowflake">Snowflake (Data Warehouse)</option>
                  <option value="sqlite">SQLite (Local Database)</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose your database connection type
                </p>
                {/* Test Connection button placed below the target select for visibility */}
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={async () => {
                      setIsTestingConnection(true);
                      setConnectionStatus(null);

                      try {
                        const resp = await fetch('/api/db/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ target })
                        });

                        interface ConnectionApiResponse {
                          success: boolean;
                          message?: string;
                          error?: string;
                          diagnostics?: { [k: string]: unknown } | null;
                        }

                        const data =
                          (await resp.json()) as ConnectionApiResponse;
                        setConnectionStatus(data);
                      } catch (err) {
                        setConnectionStatus({
                          success: false,
                          error:
                            err instanceof Error ? err.message : 'Network error'
                        });
                      } finally {
                        setIsTestingConnection(false);
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-3 sm:py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm min-h-[44px] touch-manipulation active:scale-95 transition-transform"
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  {connectionStatus && (
                    <div
                      className={`flex flex-col sm:inline-flex items-start sm:items-center px-3 py-2 text-sm rounded-lg sm:ml-3 mt-2 sm:mt-0 shadow-sm ${connectionStatus.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-semibold mr-3">
                            {connectionStatus.success ? 'Connected' : 'Failed'}
                          </span>
                          <span className="opacity-90">
                            {connectionStatus.message ??
                              connectionStatus.error ??
                              ''}
                          </span>
                        </div>
                        {currentDiag && (
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            {currentDiag.latencyMs !== undefined &&
                              currentDiag.latencyMs !== null && (
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded-md">
                                  Latency: {String(currentDiag.latencyMs)}ms
                                </span>
                              )}
                            {currentDiag.ping !== undefined && (
                              <span className="bg-white/10 text-white px-2 py-0.5 rounded-md">
                                Ping: {String(currentDiag.ping)}ms
                              </span>
                            )}
                            {currentDiag.details !== undefined && (
                              <span className="bg-white/10 text-white px-2 py-0.5 rounded-md">
                                Details: {String(currentDiag.details)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="flex-1 flex justify-center items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent rounded-xl shadow-lg text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 min-h-[48px] sm:min-h-[52px] touch-manipulation active:scale-95"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.972 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Executing Query...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Execute Query
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={
                  showSchema ? () => setShowSchema(false) : handleFetchSchema
                }
                disabled={isLoadingSchema}
                className="flex justify-center items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 min-h-[48px] sm:min-h-[52px] touch-manipulation active:scale-95"
              >
                {isLoadingSchema ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading Schema...
                  </>
                ) : showSchema ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 10.125A3.375 3.375 0 1120.25 6.75a3.375 3.375 0 01-6.375 2.25zM9.879 12.121L7.5 14.5m8.379-8.379l2.121 2.121M9.879 9.879l-2.16 2.16M14.121 14.121l2.16-2.16M9.879 14.121l1.515-1.515M14.121 9.879l-1.515 1.515"
                      />
                    </svg>
                    Hide Schema
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Schema
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-red-600 dark:text-red-400"
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
                  </div>
                  <div className="ml-8">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Query Error
                    </h3>
                    <div className="text-base text-red-700 dark:text-red-300 leading-relaxed">
                      {typeof error === 'string' ? (
                        error
                      ) : (
                        <div className="space-y-2">
                          <div className="font-semibold">{error.error}</div>
                          {error.details && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {error.details}
                            </div>
                          )}
                          {error.suggestion && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              <strong>Suggestion:</strong> {error.suggestion}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && result.success && (
            <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              {result.mocked && (
                <div className="mb-4 px-6 py-3 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <strong>Note:</strong> These results are mocked because the
                  MCP-DB Connector was not reachable. Start your MCP server or
                  set <code>MCP_SERVER_URL</code> to get real data.
                </div>
              )}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-green-600 dark:text-green-400"
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
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Query Executed Successfully
                    </h3>
                    <div className="mt-1 text-base text-green-700 dark:text-green-300">
                      {result.executionTime
                        ? `⚡ Executed in ${result.executionTime}ms`
                        : '✨ Query completed successfully'}
                    </div>
                  </div>
                </div>
              </div>

              {result.query && (
                <div className="mb-8">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-1 rounded-2xl">
                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 px-4 pt-4">
                      <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 01-2 2z" />
                      </svg>
                      Generated SQL Query
                    </h4>
                    <div className="bg-gray-900 dark:bg-gray-800 mx-4 mb-4 p-4 rounded-xl overflow-x-auto border border-gray-700 dark:border-gray-600">
                      <pre className="text-green-400 dark:text-green-300 text-sm font-mono leading-relaxed">
                        <code>{result.query}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {result.data && result.data.length > 0 ? (
                <div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-1 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 mb-4 sm:mb-6 gap-3 sm:gap-0">
                      <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h2z"
                          />
                        </svg>
                        Query Results
                        <span className="ml-3 text-sm font-normal bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                          {result.data.length} rows
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 min-h-[44px] touch-manipulation active:scale-95"
                          title="Export as CSV"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          CSV
                        </button>
                        <button
                          onClick={handleExportJSON}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 min-h-[44px] touch-manipulation active:scale-95"
                          title="Export as JSON"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 7.5c-1.5 0-2.25.75-2.25 2.25v4.5c0 1.5.75 2.25 2.25 2.25M17.25 7.5c1.5 0 2.25.75 2.25 2.25v4.5c0 1.5-.75 2.25-2.25 2.25"
                            />
                          </svg>
                          JSON
                        </button>
                        <button
                          onClick={handleCopyToClipboard}
                          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2 text-sm font-medium ${
                            copySuccess
                              ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500'
                          } border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors duration-200 min-h-[44px] touch-manipulation active:scale-95`}
                          title="Copy to clipboard"
                        >
                          {copySuccess ? (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mx-2 sm:mx-4 mb-4 overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="overflow-x-auto bg-white dark:bg-gray-800 scrollbar-visible">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                          {renderTableHeaders(result.data)}
                          {renderTableRows(result.data)}
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    No Results Found
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    This query didn&apos;t return any data
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add loading indicator with text to results area */}
          {isLoading && (
            <div className="flex flex-col justify-center items-center py-12">
              <svg
                className="animate-spin h-10 w-10 text-blue-600 mb-4"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.972 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Loading queries...
              </p>
            </div>
          )}

          {/* Schema Display */}
          {showSchema && renderSchema()}
        </div>
      </div>
    </>
  );
}

// helper CSV utilities
function convertToCSV(data: Record<string, unknown>[]) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

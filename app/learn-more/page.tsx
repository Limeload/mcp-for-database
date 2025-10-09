'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * Learn More Page
 * Comprehensive information about MCP Database Console, features, technology stack, and use cases
 */
export default function LearnMorePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105"
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

      <div
        className={
          theme === 'dark'
            ? 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'min-h-screen bg-gradient-to-br from-white via-white to-white'
        }
      >
        {/* Navigation Header */}
        <nav className="relative z-40 w-full px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              ← MCP Database Console
            </Link>
            <div className="flex items-center gap-4"></div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden pt-10">
          <div
            className={
              theme === 'dark'
                ? 'absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5'
                : 'absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10'
            }
          ></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Learn More About MCP Database Console
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Discover how our revolutionary natural language database
                interface transforms the way you interact with your data.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* What is MCP Section */}
          <section className="mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                What is MCP Database Console?
              </h2>
              <div className="space-y-6 text-gray-600 dark:text-gray-300">
                <p className="text-lg leading-relaxed">
                  <strong>MCP Database Console</strong> is a cutting-edge web
                  application that transforms natural language into powerful
                  database queries. Built with Next.js and powered by the MCP-DB
                  Connector, it democratizes database access by allowing users
                  to interact with databases using plain English instead of
                  complex SQL syntax.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-blue-500">
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-3">
                    The Problem We Solve
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <strong>SQL Complexity:</strong> Writing SQL queries
                      requires technical expertise and knowledge of database
                      schemas
                    </li>
                    <li>
                      <strong>Accessibility:</strong> Non-technical users
                      struggle to extract insights from databases
                    </li>
                    <li>
                      <strong>Time Consumption:</strong> Developers spend
                      significant time writing and debugging SQL queries
                    </li>
                    <li>
                      <strong>Learning Curve:</strong> New team members need
                      time to understand database structures
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-3">
                    Our Solution
                  </h3>
                  <p>
                    Transform natural language into powerful database queries
                    through an intuitive web interface that:
                  </p>
                  <ul className="space-y-2 mt-3">
                    <li>
                      <strong>Understands Context:</strong> Interprets user
                      intent from conversational prompts
                    </li>
                    <li>
                      <strong>Supports Multiple Databases:</strong> Works with
                      SQLAlchemy, Snowflake, and SQLite databases
                    </li>
                    <li>
                      <strong>Provides Real-time Results:</strong> Shows query
                      results instantly in formatted tables
                    </li>
                    <li>
                      <strong>Handles Errors Gracefully:</strong> Offers helpful
                      error messages and suggestions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Key Benefits Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Key Benefits
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Transform your data interaction experience with these powerful
                advantages
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Democratize Data Access
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Enable non-technical users to query databases using natural
                  language, breaking down barriers between business users and
                  data insights.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Increase Productivity
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Reduce time spent on query writing and debugging. Get answers
                  faster with intelligent natural language processing.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Improve Accuracy
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Minimize SQL syntax errors through natural language processing
                  and intelligent query generation.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-6">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Enhance Collaboration
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Allow team members to share insights without requiring SQL
                  knowledge, fostering better data-driven decision making.
                </p>
              </div>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="mb-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ideal Use Cases
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Perfect for a wide range of users and scenarios
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                    Business Analysts
                  </h3>
                </div>
                <ul className="text-blue-800 dark:text-blue-400 space-y-2 text-sm">
                  <li>• Quick data insights without waiting for developers</li>
                  <li>• Ad-hoc reporting on-demand</li>
                  <li>• Pattern discovery and trend analysis</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-2xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14-7v16l-4-3.5-4 3.5V11a2 2 0 012-2h4zm-8 14v-2a3 3 0 013-3h3a3 3 0 013 3v2H7a2 2 0 00-2 2h8a2 2 0 002-2v-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">
                    Product Managers
                  </h3>
                </div>
                <ul className="text-purple-800 dark:text-purple-400 space-y-2 text-sm">
                  <li>• User behavior analytics</li>
                  <li>• Feature adoption analysis</li>
                  <li>• Competitive intelligence gathering</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-2xl border border-green-100 dark:border-green-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                    Data Scientists
                  </h3>
                </div>
                <ul className="text-green-800 dark:text-green-400 space-y-2 text-sm">
                  <li>• Rapid hypothesis testing</li>
                  <li>• Data quality validation</li>
                  <li>• Exploratory analysis</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-8 rounded-2xl border border-orange-100 dark:border-orange-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">
                    Operations Teams
                  </h3>
                </div>
                <ul className="text-orange-800 dark:text-orange-400 space-y-2 text-sm">
                  <li>• System monitoring queries</li>
                  <li>• Incident analysis</li>
                  <li>• Resource usage patterns</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-8 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">
                    Students & Researchers
                  </h3>
                </div>
                <ul className="text-indigo-800 dark:text-indigo-400 space-y-2 text-sm">
                  <li>• Learning SQL concepts</li>
                  <li>• Academic database queries</li>
                  <li>• Research data analysis</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-8 rounded-2xl border border-pink-100 dark:border-pink-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-300">
                    IT Administrators
                  </h3>
                </div>
                <ul className="text-pink-800 dark:text-pink-400 space-y-2 text-sm">
                  <li>• Permission audits</li>
                  <li>• Security monitoring</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Supported Databases Section */}
          <section className="mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Supported Databases
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Currently Supported
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">SN</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Snowflake
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Cloud data warehouse for analytics
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">SA</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          SQLAlchemy
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Python ORM for multiple databases
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-100 rounded-lg">
                      <div className="w-8 h-8 bg-slate-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold">SQ</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          SQLite
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Lightweight file-based database
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Coming Soon
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg opacity-75">
                      <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">PG</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          PostgreSQL
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Advanced open-source relational database
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg opacity-75">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">MY</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          MySQL
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Popular open-source database
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-75">
                      <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">MS</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Microsoft SQL Server
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Enterprise relational database
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg opacity-75">
                      <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">MG</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          MongoDB
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Leading NoSQL document database
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started Section */}
          <section className="mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
              <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Experience the power of natural language database queries in
                just a few clicks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/db-console"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Try Database Console
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </section>

          {/* Hacktoberfest Section */}
          <section className="mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Hacktoberfest 2025</h2>
                <p className="text-xl mb-6 opacity-90">
                  Join the{' '}
                  <a
                    href="https://github.com/Limeload/mcp-for-database"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-semibold"
                  >
                    open-source community
                  </a>{' '}
                  and contribute to this amazing project!
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-4">Get Recognized</h3>
                  <p className="opacity-90 mb-4">
                    After <strong>15 approved pull requests</strong>,
                    you&apos;ll be added to our collaborators list!
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="font-semibold mb-2">
                        Good First Issues
                      </div>
                      <div className="opacity-90">Perfect for newcomers</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="font-semibold mb-2">15 Approved PRs</div>
                      <div className="opacity-90">Earn collaborator status</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="font-semibold mb-2">Learn & Grow</div>
                      <div className="opacity-90">Build your portfolio</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

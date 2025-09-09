import Link from 'next/link';

/**
 * Home Page
 * Provides navigation to the database console and other features
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            MCP Database Console
          </h1>
          <p className="text-gray-600 mb-8">
            Query your database using natural language prompts powered by the MCP-DB Connector
          </p>
          <Link
            href="/db-console"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Open Database Console
          </Link>
        </div>
      </div>
    </div>
  );
}

import DbConsole from '@/app/components/DbConsole';

/**
 * Database Console Page
 * A page that provides a user interface for executing database queries
 * using natural language prompts through the MCP-DB Connector
 */
export default function DatabaseConsolePage() {
  return (
    // add dark:bg-* so tailwind switches background when html.dark is set
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DbConsole />
    </div>
  );
}
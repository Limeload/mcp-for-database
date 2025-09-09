import DbConsole from '@/app/components/DbConsole';

/**
 * Database Console Page
 * A page that provides a user interface for executing database queries
 * using natural language prompts through the MCP-DB Connector
 */
export default function DatabaseConsolePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <DbConsole />
    </div>
  );
}

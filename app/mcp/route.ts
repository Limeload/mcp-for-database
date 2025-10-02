import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { DatabaseConnectionPool } from '../lib/database-pool';
import { DatabaseTarget } from '../types/database';

// Initialize connection pool manager
const connectionPool = new DatabaseConnectionPool({
  maxConnections: 10,
  connectionTimeout: 30000,
  idleTimeout: 60000,
  cleanupInterval: 120000
});

// StreamableHttp server with database connection management
const handler = createMcpHandler(
  async server => {
    // Database query tool with connection pooling
    server.tool(
      'database_query',
      'Execute a database query with connection pooling support',
      {
        prompt: z.string().describe('Natural language query prompt'),
        target: z
          .enum(['sqlalchemy', 'snowflake'])
          .describe('Database target type'),
        connectionId: z
          .string()
          .optional()
          .describe('Optional connection ID for reusing connections'),
        maxExecutionTime: z
          .number()
          .optional()
          .default(30000)
          .describe('Maximum execution time in milliseconds')
      },
      async ({
        prompt,
        target,
        connectionId,
        maxExecutionTime
      }: {
        prompt: string;
        target: 'sqlalchemy' | 'snowflake';
        connectionId?: string;
        maxExecutionTime?: number;
      }) => {
        try {
          const result = await connectionPool.executeQuery({
            prompt,
            target: target as DatabaseTarget,
            connectionId,
            maxExecutionTime
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    data: result.data,
                    query: result.query,
                    executionTime: result.executionTime,
                    connectionId: result.connectionId,
                    activeConnections: connectionPool.getActiveConnectionCount()
                  },
                  null,
                  2
                )
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                    activeConnections: connectionPool.getActiveConnectionCount()
                  },
                  null,
                  2
                )
              }
            ]
          };
        }
      }
    );

    // Connection management tools
    server.tool(
      'get_connection_stats',
      'Get current connection pool statistics',
      {},
      async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(connectionPool.getStats(), null, 2)
          }
        ]
      })
    );

    server.tool(
      'close_connection',
      'Close a specific database connection',
      {
        connectionId: z.string().describe('Connection ID to close')
      },
      async ({ connectionId }: { connectionId: string }) => {
        try {
          await connectionPool.closeConnection(connectionId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Connection ${connectionId} closed successfully`
                  },
                  null,
                  2
                )
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Failed to close connection'
                  },
                  null,
                  2
                )
              }
            ]
          };
        }
      }
    );

    server.tool(
      'cleanup_idle_connections',
      'Manually cleanup idle connections',
      {},
      async () => {
        const cleaned = await connectionPool.cleanupIdleConnections();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  cleanedConnections: cleaned,
                  message: `Cleaned up ${cleaned} idle connections`
                },
                null,
                2
              )
            }
          ]
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        database_query: {
          description: 'Execute database queries with connection pooling'
        },
        get_connection_stats: {
          description: 'Get connection pool statistics'
        },
        close_connection: {
          description: 'Close a specific database connection'
        },
        cleanup_idle_connections: {
          description: 'Cleanup idle database connections'
        }
      }
    }
  },
  {
    basePath: '',
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true
  }
);

// Cleanup on process termination
process.on('SIGTERM', async () => {
  await connectionPool.closeAllConnections();
});

process.on('SIGINT', async () => {
  await connectionPool.closeAllConnections();
});

export { handler as GET, handler as POST, handler as DELETE };

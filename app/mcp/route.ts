import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { isWriteQuery } from '@/app/lib/sql/operation';
import { TableMetadata, ColumnMetadata, ForeignKeyMetadata, RelationshipMetadata } from '@/app/types/database';

// StreamableHttp server
const handler = createMcpHandler(
  async server => {
    // Core database tools implementation
    
    server.tool(
      'query_database',
      'Execute SQL queries safely against configured databases',
      {
        query: z.string().min(1, 'Query cannot be empty'),
        target: z.enum(['sqlalchemy', 'snowflake', 'sqlite'] as const),
        database_id: z.string().optional()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ query, target, database_id }) => {
        try {
          // Validate query safety
          if (isWriteQuery(query)) {
            return {
              content: [{
                type: 'text',
                text: `Error: Write operations are not allowed through this tool. Use specific insert/update/delete tools instead.`
              }]
            };
          }

          // Forward to existing API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/db/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: query,
              target: target
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Query execution failed: ${errorData.error?.message || 'Unknown error'}`
              }]
            };
          }

          const data = await response.json();
          
          if (data.status === 'error') {
            return {
              content: [{
                type: 'text',
                text: `Query execution failed: ${data.error.message}`
              }]
            };
          }

          // Format results for MCP response
          const results = data.data || [];
          const queryText = data.metadata?.query || query;
          const executionTime = data.metadata?.executionTime || 0;
          
          let resultText = `Query executed successfully in ${executionTime}ms\n\n`;
          resultText += `SQL: ${queryText}\n\n`;
          
          if (results.length === 0) {
            resultText += 'No results returned.';
          } else {
            resultText += `Results (${results.length} rows):\n`;
            resultText += JSON.stringify(results, null, 2);
          }

          return {
            content: [{
              type: 'text',
              text: resultText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Query execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    server.tool(
      'describe_database',
      'Retrieve schema metadata including tables, columns, and relationships',
      {
        target: z.enum(['sqlalchemy', 'snowflake', 'sqlite'] as const),
        table_name: z.string().optional()
      },
      async ({ target, table_name }) => {
        try {
          const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/schema`);
          url.searchParams.set('target', target);
          
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Schema retrieval failed: ${errorData.error?.message || 'Unknown error'}`
              }]
            };
          }

          const data = await response.json();
          
          if (data.status === 'error') {
            return {
              content: [{
                type: 'text',
                text: `Schema retrieval failed: ${data.error.message}`
              }]
            };
          }

          const schema = data.data;
          let resultText = `Database Schema for ${target.toUpperCase()}\n`;
          resultText += `Version: ${schema.version}\n`;
          resultText += `Last Updated: ${schema.lastUpdated}\n`;
          resultText += `Total Tables: ${schema.totalTables}\n`;
          resultText += `Total Columns: ${schema.totalColumns}\n\n`;

          if (table_name) {
            // Filter for specific table
            const table = schema.tables.find((t: TableMetadata) => 
              t.name.toLowerCase() === table_name.toLowerCase()
            );
            
            if (!table) {
              return {
                content: [{
                  type: 'text',
                  text: `Table '${table_name}' not found in schema.`
                }]
              };
            }

            resultText += `Table: ${table.name}\n`;
            resultText += `Schema: ${table.schema}\n`;
            resultText += `Type: ${table.type}\n`;
            resultText += `Row Count: ${table.rowCount || 'Unknown'}\n`;
            resultText += `Description: ${table.description || 'No description'}\n\n`;
            
            resultText += 'Columns:\n';
            table.columns.forEach((col: ColumnMetadata) => {
              resultText += `  - ${col.name} (${col.dataType})`;
              if (col.isPrimaryKey) resultText += ' [PRIMARY KEY]';
              if (col.isForeignKey) resultText += ' [FOREIGN KEY]';
              if (!col.isNullable) resultText += ' [NOT NULL]';
              if (col.maxLength) resultText += ` [Max Length: ${col.maxLength}]`;
              resultText += '\n';
            });

            if (table.foreignKeys && table.foreignKeys.length > 0) {
              resultText += '\nForeign Keys:\n';
              table.foreignKeys.forEach((fk: ForeignKeyMetadata) => {
                resultText += `  - ${fk.name}: ${fk.columns.join(', ')} -> ${fk.referencedTable}.${fk.referencedColumns.join(', ')}\n`;
              });
            }
          } else {
            // Show all tables summary
            resultText += 'Tables:\n';
            schema.tables.forEach((table: TableMetadata) => {
              resultText += `  - ${table.name} (${table.schema}) - ${table.columns.length} columns`;
              if (table.rowCount) resultText += ` - ${table.rowCount} rows`;
              resultText += '\n';
            });

            if (schema.relationships && schema.relationships.length > 0) {
              resultText += '\nRelationships:\n';
              schema.relationships.forEach((rel: RelationshipMetadata) => {
                resultText += `  - ${rel.fromTable} -> ${rel.toTable} (${rel.type})\n`;
              });
            }
          }

          return {
            content: [{
              type: 'text',
              text: resultText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Schema retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    server.tool(
      'list_databases',
      'Lists user\'s configured databases with connection status',
      {},
      async () => {
        try {
          // For now, return configured database targets
          // In a real implementation, this would check actual database connections
          const databases = [
            {
              id: 'sqlalchemy-main',
              name: 'SQLAlchemy Main Database',
              type: 'sqlalchemy',
              status: 'connected',
              description: 'Primary PostgreSQL database via SQLAlchemy'
            },
            {
              id: 'snowflake-warehouse',
              name: 'Snowflake Data Warehouse',
              type: 'snowflake',
              status: 'connected',
              description: 'Analytics data warehouse'
            },
            {
              id: 'sqlite-local',
              name: 'SQLite Local Database',
              type: 'sqlite',
              status: 'connected',
              description: 'Local development database'
            }
          ];

          let resultText = 'Configured Databases:\n\n';
          databases.forEach(db => {
            resultText += `ID: ${db.id}\n`;
            resultText += `Name: ${db.name}\n`;
            resultText += `Type: ${db.type}\n`;
            resultText += `Status: ${db.status}\n`;
            resultText += `Description: ${db.description}\n\n`;
          });

          return {
            content: [{
              type: 'text',
              text: resultText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Database listing error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    server.tool(
      'insert_record',
      'Insert new records into a database table',
      {
        table_name: z.string().min(1, 'Table name is required'),
        target: z.enum(['sqlalchemy', 'snowflake', 'sqlite'] as const),
        data: z.record(z.unknown()).refine(data => Object.keys(data).length > 0, 'Data object cannot be empty'),
        database_id: z.string().optional()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ table_name, target, data, database_id }) => {
        try {
          // Validate data object
          const dataEntries = Object.entries(data);
          if (dataEntries.length === 0) {
            return {
              content: [{
                type: 'text',
                text: 'Error: No data provided for insertion.'
              }]
            };
          }

          // Construct INSERT query
          const columns = dataEntries.map(([key]) => key).join(', ');
          const values = dataEntries.map(([, value]) => {
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
            }
            return value;
          }).join(', ');

          const insertQuery = `INSERT INTO ${table_name} (${columns}) VALUES (${values})`;

          // Forward to existing API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/db/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: insertQuery,
              target: target
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Insert operation failed: ${errorData.error?.message || 'Unknown error'}`
              }]
            };
          }

          const responseData = await response.json();
          
          if (responseData.status === 'error') {
            return {
              content: [{
                type: 'text',
                text: `Insert operation failed: ${responseData.error.message}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: `Record inserted successfully into ${table_name}.\n\nSQL: ${insertQuery}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Insert operation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    server.tool(
      'update_record',
      'Update existing records in a database table',
      {
        table_name: z.string().min(1, 'Table name is required'),
        target: z.enum(['sqlalchemy', 'snowflake', 'sqlite'] as const),
        data: z.record(z.unknown()).refine(data => Object.keys(data).length > 0, 'Data object cannot be empty'),
        where_clause: z.string().min(1, 'WHERE clause is required for safety'),
        database_id: z.string().optional()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ table_name, target, data, where_clause, database_id }) => {
        try {
          // Validate data object
          const dataEntries = Object.entries(data);
          if (dataEntries.length === 0) {
            return {
              content: [{
                type: 'text',
                text: 'Error: No data provided for update.'
              }]
            };
          }

          // Construct UPDATE query
          const setClause = dataEntries.map(([key, value]) => {
            if (typeof value === 'string') {
              return `${key} = '${value.replace(/'/g, "''")}'`; // Escape single quotes
            }
            return `${key} = ${value}`;
          }).join(', ');

          const updateQuery = `UPDATE ${table_name} SET ${setClause} WHERE ${where_clause}`;

          // Forward to existing API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/db/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: updateQuery,
              target: target
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Update operation failed: ${errorData.error?.message || 'Unknown error'}`
              }]
            };
          }

          const responseData = await response.json();
          
          if (responseData.status === 'error') {
            return {
              content: [{
                type: 'text',
                text: `Update operation failed: ${responseData.error.message}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: `Records updated successfully in ${table_name}.\n\nSQL: ${updateQuery}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Update operation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    server.tool(
      'delete_record',
      'Delete records from a database table',
      {
        table_name: z.string().min(1, 'Table name is required'),
        target: z.enum(['sqlalchemy', 'snowflake', 'sqlite'] as const),
        where_clause: z.string().min(1, 'WHERE clause is required for safety'),
        database_id: z.string().optional()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async ({ table_name, target, where_clause, database_id }) => {
        try {
          // Construct DELETE query
          const deleteQuery = `DELETE FROM ${table_name} WHERE ${where_clause}`;

          // Forward to existing API endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/db/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: deleteQuery,
              target: target
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            return {
              content: [{
                type: 'text',
                text: `Delete operation failed: ${errorData.error?.message || 'Unknown error'}`
              }]
            };
          }

          const responseData = await response.json();
          
          if (responseData.status === 'error') {
            return {
              content: [{
                type: 'text',
                text: `Delete operation failed: ${responseData.error.message}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: `Records deleted successfully from ${table_name}.\n\nSQL: ${deleteQuery}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Delete operation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      }
    );

    // Keep the original echo tool for backward compatibility
    server.tool(
      'echo',
      'Echo a message (for testing purposes)',
      {
        message: z.string()
      },
      async ({ message }) => ({
        content: [{ type: 'text', text: `Tool echo: ${message}` }]
      })
    );
  },
  {
    capabilities: {
      tools: {
        query_database: {
          description: 'Execute SQL queries safely against configured databases'
        },
        describe_database: {
          description: 'Retrieve schema metadata including tables, columns, and relationships'
        },
        list_databases: {
          description: 'Lists user\'s configured databases with connection status'
        },
        insert_record: {
          description: 'Insert new records into a database table'
        },
        update_record: {
          description: 'Update existing records in a database table'
        },
        delete_record: {
          description: 'Delete records from a database table'
        },
        echo: {
          description: 'Echo a message (for testing purposes)'
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

export { handler as GET, handler as POST, handler as DELETE };

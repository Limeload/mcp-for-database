/**
 * Integration tests for MCP database tools
 * Tests all core MCP tools: query_database, describe_database, list_databases, 
 * insert_record, update_record, delete_record
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import type { DatabaseTarget } from '@/app/types/database';
import type { SchemaMetadata, TableMetadata } from '@/app/types/database';

// Mock fetch for testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Type definitions for test interfaces
interface MockServer {
  tool: jest.MockedFunction<(name: string, description: string, schema: any, implementation: Function) => void>;
}

interface MockMcpHandler {
  GET: jest.MockedFunction<any>;
  POST: jest.MockedFunction<any>;
  DELETE: jest.MockedFunction<any>;
}

interface ToolCall {
  name: string;
  description: string;
  schema: any;
  implementation: Function;
}

describe('MCP Database Tools Integration Tests', () => {
  let mcpHandler: MockMcpHandler;
  let mockServer: MockServer;

  beforeAll(() => {
    // Mock the MCP handler
    mockServer = {
      tool: jest.fn()
    };
    
    // Mock the createMcpHandler function
    jest.doMock('mcp-handler', () => ({
      createMcpHandler: jest.fn((toolSetupFn: (server: MockServer) => void) => {
        toolSetupFn(mockServer);
        return {
          GET: jest.fn(),
          POST: jest.fn(),
          DELETE: jest.fn()
        };
      })
    }));
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('query_database tool', () => {
    test('should execute SELECT queries successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ],
          metadata: {
            query: 'SELECT * FROM users',
            executionTime: 45
          }
        })
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Get the tool implementation
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      expect(toolCall).toBeDefined();
      
      const toolImplementation = toolCall[3];
      const result = await toolImplementation({
        query: 'SELECT * FROM users',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query executed successfully');
      expect(result.content[0].text).toContain('Results (2 rows)');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/db/query'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'SELECT * FROM users',
            target: 'sqlalchemy'
          })
        })
      );
    });

    test('should reject write operations', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        query: 'INSERT INTO users (name) VALUES ("test")',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Write operations are not allowed');
    });

    test('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Database connection failed' }
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        query: 'SELECT * FROM users',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query execution failed');
    });
  });

  describe('describe_database tool', () => {
    test('should retrieve schema metadata successfully', async () => {
      const mockSchemaResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: {
            version: '1.0.0',
            lastUpdated: '2024-01-01T00:00:00Z',
            totalTables: 2,
            totalColumns: 8,
            tables: [
              {
                name: 'users',
                schema: 'public',
                type: 'table',
                columns: [
                  { name: 'id', dataType: 'INTEGER', isPrimaryKey: true, isNullable: false },
                  { name: 'name', dataType: 'VARCHAR', isPrimaryKey: false, isNullable: true }
                ],
                rowCount: 100
              }
            ],
            relationships: []
          }
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockSchemaResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'describe_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Database Schema for SQLALCHEMY');
      expect(result.content[0].text).toContain('Total Tables: 2');
      expect(result.content[0].text).toContain('users (public)');
    });

    test('should filter by table name when provided', async () => {
      const mockSchemaResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: {
            version: '1.0.0',
            lastUpdated: '2024-01-01T00:00:00Z',
            totalTables: 1,
            totalColumns: 2,
            tables: [
              {
                name: 'users',
                schema: 'public',
                type: 'table',
                columns: [
                  { name: 'id', dataType: 'INTEGER', isPrimaryKey: true, isNullable: false },
                  { name: 'name', dataType: 'VARCHAR', isPrimaryKey: false, isNullable: true }
                ],
                rowCount: 100
              }
            ],
            relationships: []
          }
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockSchemaResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'describe_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        target: 'sqlalchemy',
        table_name: 'users'
      });

      expect(result.content[0].text).toContain('Table: users');
      expect(result.content[0].text).toContain('Columns:');
    });
  });

  describe('list_databases tool', () => {
    test('should return configured databases', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'list_databases');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({});

      expect(result.content[0].text).toContain('Configured Databases');
      expect(result.content[0].text).toContain('sqlalchemy-main');
      expect(result.content[0].text).toContain('snowflake-warehouse');
      expect(result.content[0].text).toContain('sqlite-local');
    });
  });

  describe('insert_record tool', () => {
    test('should insert records successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: []
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'insert_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        data: { name: 'John Doe', email: 'john@example.com' }
      });

      expect(result.content[0].text).toContain('Record inserted successfully');
      expect(result.content[0].text).toContain('INSERT INTO users');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/db/query'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('INSERT INTO users')
        })
      );
    });

    test('should validate required parameters', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'insert_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        data: {}
      });

      expect(result.content[0].text).toContain('No data provided for insertion');
    });

    test('should escape SQL injection attempts', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: []
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'insert_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        data: { name: "John'; DROP TABLE users; --" }
      });

      expect(result.content[0].text).toContain('Record inserted successfully');
      // The SQL should be properly escaped
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining("'John''; DROP TABLE users; --'")
        })
      );
    });
  });

  describe('update_record tool', () => {
    test('should update records successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: []
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'update_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        data: { name: 'Jane Doe' },
        where_clause: 'id = 1'
      });

      expect(result.content[0].text).toContain('Records updated successfully');
      expect(result.content[0].text).toContain('UPDATE users SET');
      expect(result.content[0].text).toContain('WHERE id = 1');
    });

    test('should require WHERE clause for safety', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'update_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        data: { name: 'Jane Doe' },
        where_clause: ''
      });

      expect(result.content[0].text).toContain('No data provided for update');
    });
  });

  describe('delete_record tool', () => {
    test('should delete records successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: []
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'delete_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        where_clause: 'id = 1'
      });

      expect(result.content[0].text).toContain('Records deleted successfully');
      expect(result.content[0].text).toContain('DELETE FROM users WHERE id = 1');
    });

    test('should require WHERE clause for safety', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'delete_record');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        table_name: 'users',
        target: 'sqlalchemy',
        where_clause: ''
      });

      expect(result.content[0].text).toContain('No data provided for update');
    });
  });

  describe('echo tool', () => {
    test('should echo messages correctly', async () => {
      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'echo');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        message: 'Hello, MCP!'
      });

      expect(result.content[0].text).toBe('Tool echo: Hello, MCP!');
    });
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        query: 'SELECT * FROM users',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query execution error');
      expect(result.content[0].text).toContain('Network error');
    });

    test('should handle malformed responses', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'error',
          error: { message: 'Invalid query syntax' }
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        query: 'INVALID SQL',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query execution failed');
      expect(result.content[0].text).toContain('Invalid query syntax');
    });
  });

  describe('MCP Protocol Compliance', () => {
    test('should register all required tools', () => {
      const registeredTools = mockServer.tool.mock.calls.map(call => call[0]);
      
      expect(registeredTools).toContain('query_database');
      expect(registeredTools).toContain('describe_database');
      expect(registeredTools).toContain('list_databases');
      expect(registeredTools).toContain('insert_record');
      expect(registeredTools).toContain('update_record');
      expect(registeredTools).toContain('delete_record');
      expect(registeredTools).toContain('echo');
    });

    test('should have proper tool descriptions', () => {
      const toolCalls = mockServer.tool.mock.calls;
      
      toolCalls.forEach(call => {
        const [name, description] = call;
        expect(description).toBeDefined();
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });

    test('should have proper parameter schemas', () => {
      const toolCalls = mockServer.tool.mock.calls;
      
      toolCalls.forEach(call => {
        const [name, description, schema] = call;
        expect(schema).toBeDefined();
        expect(typeof schema).toBe('object');
      });
    });

    test('should return proper MCP response format', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'success',
          data: []
        })
      };
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const toolCall = mockServer.tool.mock.calls.find(call => call[0] === 'query_database');
      const toolImplementation = toolCall[3];
      
      const result = await toolImplementation({
        query: 'SELECT 1',
        target: 'sqlalchemy'
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(typeof result.content[0].text).toBe('string');
    });
  });
});

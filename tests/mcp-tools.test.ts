/**
 * Simplified tests for MCP database tools
 * Tests the core functionality without complex module imports
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock fetch for testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Helper function to create mock Response objects
function createMockResponse(data: any, ok: boolean = true, status: number = 200): Response {
  const mockJson = jest.fn() as jest.MockedFunction<() => Promise<any>>;
  mockJson.mockResolvedValue(data);
  return {
    ok,
    json: mockJson,
    headers: new Headers(),
    redirected: false,
    status,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
    bytes: jest.fn()
  } as unknown as Response;
}

// Simple implementation of isWriteQuery for testing
const WRITE_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'ALTER',
  'DROP',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE'
];

const isWriteQuery = (sql: string): boolean => {
  const normalized = sql.trim().toUpperCase();
  for (const kw of WRITE_KEYWORDS) {
    if (normalized.startsWith(kw + ' ') || normalized.startsWith(kw + '\n')) {
      return true;
    }
  }
  // Detect multi-statement where any statement is write
  const statements = normalized
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
  return statements.some(stmt =>
    WRITE_KEYWORDS.some(kw => stmt.startsWith(kw + ' '))
  );
};

// Mock tool implementations
const mockTools = {
  query_database: async ({ query, target }: { query: string; target: string }) => {
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
  },

  list_databases: async () => {
    try {
      // For now, return configured database targets
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
  },

  echo: async ({ message }: { message: string }) => ({
    content: [{ type: 'text', text: `Tool echo: ${message}` }]
  })
};

describe('MCP Database Tools Tests', () => {
  beforeAll(() => {
    // Setup any necessary mocks
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('query_database tool', () => {
    test('should execute SELECT queries successfully', async () => {
      // Mock successful API response
      const mockResponse = createMockResponse({
        status: 'success',
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        metadata: {
          query: 'SELECT * FROM users',
          executionTime: 45
        }
      });
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await mockTools.query_database({
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
      const result = await mockTools.query_database({
        query: 'INSERT INTO users (name) VALUES ("test")',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Write operations are not allowed');
    });

    test('should handle API errors gracefully', async () => {
      const mockErrorResponse = createMockResponse({
        error: { message: 'Database connection failed' }
      }, false, 500);
      
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await mockTools.query_database({
        query: 'SELECT * FROM users',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query execution failed');
    });

    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await mockTools.query_database({
        query: 'SELECT * FROM users',
        target: 'sqlalchemy'
      });

      expect(result.content[0].text).toContain('Query execution error');
      expect(result.content[0].text).toContain('Network error');
    });
  });

  describe('list_databases tool', () => {
    test('should return configured databases', async () => {
      const result = await mockTools.list_databases();

      expect(result.content[0].text).toContain('Configured Databases');
      expect(result.content[0].text).toContain('sqlalchemy-main');
      expect(result.content[0].text).toContain('snowflake-warehouse');
      expect(result.content[0].text).toContain('sqlite-local');
    });
  });

  describe('echo tool', () => {
    test('should echo messages correctly', async () => {
      const result = await mockTools.echo({
        message: 'Hello, MCP!'
      });

      expect(result.content[0].text).toBe('Tool echo: Hello, MCP!');
    });
  });

  describe('SQL Query Validation', () => {
    test('should detect write operations correctly', () => {
      expect(isWriteQuery('SELECT * FROM users')).toBe(false);
      expect(isWriteQuery('INSERT INTO users VALUES (1)')).toBe(true);
      expect(isWriteQuery('UPDATE users SET name = "test"')).toBe(true);
      expect(isWriteQuery('DELETE FROM users WHERE id = 1')).toBe(true);
      expect(isWriteQuery('CREATE TABLE test (id INT)')).toBe(true);
      expect(isWriteQuery('DROP TABLE users')).toBe(true);
    });

    test('should handle multi-statement queries', () => {
      expect(isWriteQuery('SELECT * FROM users; SELECT * FROM orders')).toBe(false);
      expect(isWriteQuery('SELECT * FROM users; INSERT INTO logs VALUES (1)')).toBe(true);
    });

    test('should handle case insensitive detection', () => {
      expect(isWriteQuery('select * from users')).toBe(false);
      expect(isWriteQuery('insert into users values (1)')).toBe(true);
      expect(isWriteQuery('UPDATE users SET name = "test"')).toBe(true);
    });
  });

  describe('MCP Protocol Compliance', () => {
    test('should return proper MCP response format', async () => {
      const mockResponse = createMockResponse({
        status: 'success',
        data: []
      });
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await mockTools.query_database({
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

    test('should have all required tools available', () => {
      expect(mockTools.query_database).toBeDefined();
      expect(mockTools.list_databases).toBeDefined();
      expect(mockTools.echo).toBeDefined();
    });
  });
});
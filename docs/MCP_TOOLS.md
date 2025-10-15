# MCP Database Tools Implementation

This document describes the implementation of core MCP (Model Context Protocol) tools for database operations in the MCP-for-Database project.

## Overview

The MCP server now implements all required core database tools that comply with the MCP protocol specification. These tools provide a standardized interface for database operations through natural language interactions.

## Implemented Tools

### 1. query_database

**Purpose**: Execute SQL queries safely against configured databases

**Parameters**:
- `query` (string, required): The SQL query to execute
- `target` (enum, required): Database target - 'sqlalchemy', 'snowflake', or 'sqlite'
- `database_id` (string, optional): Specific database identifier

**Features**:
-  Validates query safety (rejects write operations)
-  Forwards to existing API endpoint
-  Proper error handling and response formatting
-  Execution time reporting
-  Result formatting with row counts

**Example Usage**:
```typescript
interface QueryDatabaseParams {
  query: string;
  target: 'sqlalchemy' | 'snowflake' | 'sqlite';
  database_id?: string;
}

const params: QueryDatabaseParams = {
  query: "SELECT * FROM users LIMIT 10",
  target: "sqlalchemy"
};

// MCP tool call
const result = await mcpClient.callTool('query_database', params);
```


### 2. describe_database

**Purpose**: Retrieve schema metadata including tables, columns, and relationships

**Parameters**:
- `target` (enum, required): Database target - 'sqlalchemy', 'snowflake', or 'sqlite'
- `table_name` (string, optional): Specific table to describe

**Features**:
- Full schema overview or specific table details
- Column metadata (types, constraints, keys)
- Foreign key relationships
- Table statistics (row counts)
- Cached responses for performance

**Example Usage**:
```typescript
interface DescribeDatabaseParams {
  target: 'sqlalchemy' | 'snowflake' | 'sqlite';
  table_name?: string;
}

const params: DescribeDatabaseParams = {
  target: "sqlalchemy",
  table_name: "users"
};

// MCP tool call
const result = await mcpClient.callTool('describe_database', params);
```


### 3. list_databases

**Purpose**: Lists user's configured databases with connection status

**Parameters**: None

**Features**:
- Returns configured database targets
- Connection status information
- Database descriptions and metadata
- Extensible for future database types

**Example Usage**:
```typescript
// No parameters required for list_databases
const result = await mcpClient.callTool('list_databases', {});
```

### 4. insert_record

**Purpose**: Insert new records into a database table

**Parameters**:
- `table_name` (string, required): Target table name
- `target` (enum, required): Database target
- `data` (object, required): Key-value pairs for insertion
- `database_id` (string, optional): Specific database identifier

**Features**:
- SQL injection protection (proper escaping)
- Data validation
- Automatic SQL generation
- Error handling for constraint violations

**Example Usage**:
```typescript
interface InsertRecordParams {
  table_name: string;
  target: 'sqlalchemy' | 'snowflake' | 'sqlite';
  data: Record<string, unknown>;
  database_id?: string;
}

const params: InsertRecordParams = {
  table_name: "users",
  target: "sqlalchemy",
  data: {
    name: "John Doe",
    email: "john@example.com"
  }
};

// MCP tool call
const result = await mcpClient.callTool('insert_record', params);
```

### 5. update_record

**Purpose**: Update existing records in a database table

**Parameters**:
- `table_name` (string, required): Target table name
- `target` (enum, required): Database target
- `data` (object, required): Key-value pairs for update
- `where_clause` (string, required): WHERE condition for safety
- `database_id` (string, optional): Specific database identifier

**Features**:
- Requires WHERE clause for safety
- SQL injection protection
- Data validation
- Prevents accidental mass updates

**Example Usage**:
```typescript
interface UpdateRecordParams {
  table_name: string;
  target: 'sqlalchemy' | 'snowflake' | 'sqlite';
  data: Record<string, unknown>;
  where_clause: string;
  database_id?: string;
}

const params: UpdateRecordParams = {
  table_name: "users",
  target: "sqlalchemy",
  data: {
    name: "Jane Doe"
  },
  where_clause: "id = 1"
};

// MCP tool call
const result = await mcpClient.callTool('update_record', params);
```

### 6. delete_record

**Purpose**: Delete records from a database table

**Parameters**:
- `table_name` (string, required): Target table name
- `target` (enum, required): Database target
- `where_clause` (string, required): WHERE condition for safety
- `database_id` (string, optional): Specific database identifier

**Features**:
- Requires WHERE clause for safety
- Prevents accidental mass deletions
- SQL injection protection
- Confirmation of deletion

**Example Usage**:
```typescript
interface DeleteRecordParams {
  table_name: string;
  target: 'sqlalchemy' | 'snowflake' | 'sqlite';
  where_clause: string;
  database_id?: string;
}

const params: DeleteRecordParams = {
  table_name: "users",
  target: "sqlalchemy",
  where_clause: "id = 1"
};

// MCP tool call
const result = await mcpClient.callTool('delete_record', params);
```

### 7. echo (Legacy)

**Purpose**: Echo a message (for testing purposes)

**Parameters**:
- `message` (string, required): Message to echo

**Features**:
- Simple testing tool
- Backward compatibility

**Example Usage**:
```typescript
interface EchoParams {
  message: string;
}

const params: EchoParams = {
  message: "Hello, MCP!"
};

// MCP tool call
const result = await mcpClient.callTool('echo', params);
```

## Security Features

### SQL Injection Protection
- All string values are properly escaped using single quote escaping
- Parameterized queries through the existing API layer
- Input validation using Zod schemas

### Write Operation Safety
- `query_database` tool rejects write operations
- Separate tools for insert/update/delete operations
- Required WHERE clauses for update/delete operations

### Error Handling
- Comprehensive try-catch blocks
- Proper error message formatting
- Graceful degradation when services are unavailable

## MCP Protocol Compliance

### Response Format
All tools return responses in the standard MCP format:
```typescript
interface McpResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Example response
const response: McpResponse = {
  content: [{
    type: 'text',
    text: 'Response content here'
  }]
};
```

### Tool Registration
Tools are properly registered with:
- Descriptive names and descriptions
- Zod schema validation for parameters
- Proper capability declarations

### Error Responses
Error responses follow MCP standards:
- Clear error messages
- Proper content type formatting
- Graceful error handling

## Integration with Existing API

The MCP tools integrate seamlessly with the existing API infrastructure:

- **Database Queries**: Uses `/api/db/[query]` endpoint
- **Schema Information**: Uses `/api/schema` endpoint
- **Authentication**: Inherits authorization from API layer
- **Logging**: Benefits from existing correlation ID system
- **Error Handling**: Uses standardized API response format

## Testing

### Unit Tests
Comprehensive test suite covering:
- Tool parameter validation
- SQL injection protection
- Error handling scenarios
- MCP protocol compliance
- Integration with existing APIs

### Test Files
- `tests/mcp-tools.test.ts`: TypeScript Jest-based integration tests
- `scripts/test-mcp-tools.ts`: TypeScript standalone test runner
- `tests/setup.ts`: TypeScript Jest setup configuration
- `jest.config.ts`: TypeScript Jest configuration

### Running Tests
```bash
# Run Jest tests (TypeScript)
npm test

# Run tests in watch mode
npm run test:watch

# Run MCP-specific tests
npm run test:mcp

# Type check all files
npm run type-check
```

## TypeScript Support

The MCP tools implementation is fully TypeScript-compliant with comprehensive type safety:

### Type Definitions
- **Tool Parameters**: Properly typed with Zod schemas
- **API Responses**: Typed interfaces for all response formats
- **Test Cases**: Structured interfaces for test case definitions
- **Mock Functions**: Properly typed Jest mocks and responses

### Type Safety Features
- **Compile-time Error Detection**: Catch errors before runtime
- **IntelliSense Support**: Enhanced IDE autocomplete and error highlighting
- **Refactoring Safety**: Type-safe code refactoring
- **Self-Documenting Code**: Types serve as inline documentation

### TypeScript Configuration
- **Jest**: Configured with `ts-jest` for TypeScript testing
- **ESM Support**: Modern module system with ES6 imports/exports
- **Type Checking**: Comprehensive type validation across all files
- **Development Tools**: `tsx` for running TypeScript scripts

## Configuration

### Environment Variables
- `NEXT_PUBLIC_BASE_URL`: Base URL for API calls (default: http://localhost:3000)

### Database Targets
Supported database types:
- `sqlalchemy`: PostgreSQL/MySQL via SQLAlchemy
- `snowflake`: Snowflake data warehouse
- `sqlite`: Local SQLite database

## Future Enhancements

### Planned Features
-  Batch operations support
-  Transaction management
-  Query optimization suggestions
-  Real-time database connection status
-  Advanced schema introspection
-  Query performance metrics

### Extensibility
The implementation is designed for easy extension:
- New database targets can be added to the enum
- Additional tools can be registered following the same pattern
- Custom validation rules can be added per database type

## Troubleshooting

### Common Issues

1. **Tool not found**: Ensure the MCP server is properly initialized
2. **Database connection errors**: Check that the backend API is running
3. **Permission errors**: Verify user has appropriate database permissions
4. **SQL syntax errors**: Check query syntax for the target database type

### Debug Mode
Enable verbose logging by setting `verboseLogs: true` in the MCP handler configuration.

## Contributing

When adding new MCP tools:
1. Follow the established pattern for tool registration
2. Include comprehensive parameter validation with Zod schemas
3. Add appropriate error handling with proper TypeScript types
4. Write TypeScript tests for the new tool
5. Ensure all code passes TypeScript type checking
6. Update this documentation

### TypeScript Guidelines
- Use proper type annotations for all function parameters and return types
- Define interfaces for complex data structures
- Leverage Zod schemas for runtime validation
- Write tests with proper TypeScript types
- Follow the project's TypeScript configuration standards

## References

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Zod Schema Validation](https://zod.dev/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest TypeScript Support](https://jestjs.io/docs/getting-started#using-typescript)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/)

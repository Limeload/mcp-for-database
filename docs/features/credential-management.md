# Database Credential Management System

This document describes the secure database credential management system implemented in the MCP Database application.

## Overview

The credential management system provides:
- **Secure credential storage** with AES-256-GCM encryption
- **Per-user credential isolation** ensuring users can only access their own credentials
- **Support for multiple database types** (PostgreSQL, MySQL, Snowflake, SQLite)
- **Credential validation and testing** with real connection verification
- **Credential rotation capabilities** for security maintenance

## Architecture

### Core Components

1. **Credential Types** (`app/lib/database/credentials.ts`)
   - Type definitions for database credentials
   - Validation rules per database type
   - Connection string generation utilities

2. **Encryption Service** (`app/lib/database/encryption.ts`)
   - AES-256-GCM encryption/decryption
   - Secure key management
   - Development vs production key handling

3. **Credential Store** (`app/lib/database/credential-store.ts`)
   - Redis-based storage with in-memory fallback
   - Per-user credential isolation
   - CRUD operations for credentials

4. **Connection Testing** (`app/lib/database/connection-tester.ts`)
   - Real database connection testing
   - Database-specific connection validation
   - Performance metrics collection

### API Endpoints

- `GET /api/credentials` - List user's credentials
- `POST /api/credentials` - Create new credential
- `GET /api/credentials/[id]` - Get specific credential
- `PUT /api/credentials/[id]` - Update credential
- `DELETE /api/credentials/[id]` - Delete credential
- `POST /api/credentials/[id]/test` - Test credential connection
- `GET /api/db/credentials` - List credentials for query selection

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM for authenticated encryption
- **Key Management**: Environment-based key configuration
- **Development Mode**: Deterministic key generation (NOT secure for production)
- **Production Mode**: Requires base64-encoded 256-bit key

### Access Control
- **User Isolation**: Credentials are scoped to individual users
- **Authentication Required**: All endpoints require valid JWT tokens
- **Permission Checks**: Write operations require appropriate permissions

### Storage Security
- **Encrypted Storage**: Passwords are never stored in plain text
- **Redis Security**: Uses Redis for persistent storage with optional in-memory fallback
- **Key Hashing**: Credential IDs are hashed for additional security

## Supported Database Types

### PostgreSQL
```typescript
{
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'password',
  ssl: true // optional
}
```

### MySQL
```typescript
{
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  username: 'user',
  password: 'password',
  ssl: true // optional
}
```

### Snowflake
```typescript
{
  type: 'snowflake',
  account: 'account.region',
  warehouse: 'COMPUTE_WH',
  database: 'mydb',
  username: 'user',
  password: 'password',
  role: 'ACCOUNTADMIN', // optional
  schema: 'public' // optional
}
```

### SQLite
```typescript
{
  type: 'sqlite',
  database: '/path/to/database.db',
  // host, port, username, password not required
}
```

## Usage Examples

### Creating a Credential

```typescript
const response = await fetch('/api/credentials', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Production PostgreSQL',
    type: 'postgresql',
    host: 'prod-db.example.com',
    port: 5432,
    database: 'production',
    username: 'app_user',
    password: 'secure_password',
    ssl: true
  })
});
```

### Testing a Connection

```typescript
const response = await fetch('/api/credentials/cred_123/test', {
  method: 'POST'
});

const result = await response.json();
if (result.success) {
  console.log('Connection successful:', result.testResult.message);
} else {
  console.error('Connection failed:', result.testResult.error);
}
```

### Using Credentials in Queries

```typescript
const response = await fetch('/api/db/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Show me all users',
    target: 'postgresql',
    credentialId: 'cred_123' // Use stored credential
  })
});
```

## Environment Configuration

### Required Variables

```bash
# Credential encryption key (REQUIRED for production)
CREDENTIAL_ENCRYPTION_KEY=your_base64_encoded_256_bit_key

# Redis connection (optional, falls back to in-memory)
REDIS_URL=redis://localhost:6379

# JWT secret for authentication
JWT_SECRET=your_jwt_secret_key
```

### Development Variables

```bash
# Development encryption seed (NOT secure for production)
CREDENTIAL_ENCRYPTION_SEED=development-seed-key

# Auto-authentication for development
AUTO_AUTH=true
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin1234
```

## Security Best Practices

### Production Deployment

1. **Generate Secure Encryption Key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Use Strong Passwords**: Ensure database passwords are complex and unique

3. **Enable SSL**: Always use SSL/TLS for database connections in production

4. **Regular Key Rotation**: Implement a process for rotating encryption keys

5. **Monitor Access**: Log and monitor credential access patterns

### Development Guidelines

1. **Never Use Production Keys**: Use development-specific encryption seeds
2. **Test Credentials**: Use test databases, never production data
3. **Secure Local Storage**: Ensure `.env.local` is in `.gitignore`
4. **Regular Cleanup**: Remove test credentials regularly

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors**: Clear messages for invalid input
- **Authentication Errors**: Proper 401 responses for unauthorized access
- **Connection Errors**: Detailed error messages for database connection failures
- **Encryption Errors**: Secure error handling without exposing sensitive data

## Monitoring and Logging

- **Connection Testing**: All connection tests are logged with timing metrics
- **Credential Access**: User credential access is logged for audit purposes
- **Error Tracking**: All errors are logged with correlation IDs for debugging

## Future Enhancements

Planned improvements include:

- **Credential Rotation**: Automated password rotation capabilities
- **Audit Logging**: Comprehensive audit trail for credential access
- **Integration**: Support for external secret management systems (AWS Secrets Manager, HashiCorp Vault)
- **Backup/Restore**: Credential backup and restore functionality
- **Bulk Operations**: Support for bulk credential management

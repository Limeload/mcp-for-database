# API Documentation

## Overview
The MCP Database Console provides a RESTful API for executing natural language database queries. 
The API is built with Next.js and allows users to query multiple databases using natural language. 
This documentation explains all available endpoints, request formats, response formats, and includes example code in JavaScript, Python, and cURL.

## Base URL

- **Development:** `http://localhost:3000/api`  
- **Production:** (to be updated when deployed)

## Authentication

Currently, the API does not require authentication. This may change in future versions.

## Endpoints

### POST `/api/db/[query]`

Execute a database query using natural language.

#### Request

**URL:** `/api/db/[query]`  
**Method:** `POST`  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "prompt": "string",
  "target": "sqlalchemy" | "snowflake"
}
```
**Parameters:**

- `prompt` (string, required): Natural language description of the query
- `target` (string, required): Database target type
  - `"sqlalchemy"`: For SQLAlchemy-based applications
  - `"snowflake"`: For Snowflake data warehouse

#### Response

**Success Response (200):**

```json
{
  "status": "success",
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "error": null,
  "metadata": {
    "query": "SELECT column1, column2 FROM table_name",
    "executionTime": 150
  }
}
```

**Error Response (400/500):**

```json
{
  "status": "error",
  "data": null,
  "error": {
    "message": "Error message describing what went wrong",
    "code": "VALIDATION_ERROR"
  }
}
```

#### Example Requests

**Basic Query:**

```bash
curl -X POST http://localhost:3000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all users who registered in the last 30 days",
    "target": "sqlalchemy"
  }'
```

**Aggregation Query:**

```bash
curl -X POST http://localhost:3000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Find the top 10 products by sales",
    "target": "snowflake"
  }'
```

## Error Codes

| HTTP Status | Error Code       | Description                               |
| ----------- | ---------------- | ----------------------------------------- |
| 400         | VALIDATION_ERROR | Bad Request - Invalid request parameters  |
| 500         | INTERNAL_ERROR   | Internal Server Error - Server-side error |

### GET `/api/schema`

Fetch database schema metadata including tables, columns, relationships, and indexes.

#### Request

**URL:** `/api/schema`  
**Method:** `GET`  
**Content-Type:** `application/json`

**Query Parameters:**

- `target` (string, required): Database target type
  - `"sqlalchemy"`: For SQLAlchemy-based applications
  - `"snowflake"`: For Snowflake data warehouse

#### Response

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "version": "1.0.0-mock-1234567890",
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "tables": [
      {
        "name": "users",
        "schema": "public",
        "type": "table",
        "columns": [
          {
            "name": "id",
            "dataType": "INTEGER",
            "isNullable": false,
            "isPrimaryKey": true,
            "isForeignKey": false,
            "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"],
            "precision": 10,
            "scale": 0
          }
        ],
        "primaryKeys": ["id"],
        "foreignKeys": [],
        "indexes": [
          {
            "name": "idx_users_email",
            "columns": ["email"],
            "isUnique": true,
            "type": "BTREE"
          }
        ],
        "rowCount": 1250,
        "description": "User accounts table"
      }
    ],
    "relationships": [
      {
        "type": "one-to-many",
        "fromTable": "users",
        "fromColumns": ["id"],
        "toTable": "orders",
        "toColumns": ["user_id"],
        "constraintName": "fk_orders_user_id"
      }
    ],
    "schemas": ["public"],
    "totalTables": 2,
    "totalColumns": 9
  },
  "error": null,
  "metadata": {
    "cached": false,
    "timestamp": 1705312200000
  }
}
```

**Error Response (400/500):**

```json
{
  "status": "error",
  "data": null,
  "error": {
    "message": "Missing required parameter: target is required",
    "code": "VALIDATION_ERROR"
  }
}
```

#### Example Requests

**Fetch SQLAlchemy Schema:**

```bash
curl -X GET "http://localhost:3000/api/schema?target=sqlalchemy" \
  -H "Content-Type: application/json"
```

**Fetch Snowflake Schema:**

```bash
curl -X GET "http://localhost:3000/api/schema?target=snowflake" \
  -H "Content-Type: application/json"
```

### POST `/api/schema`

Manage schema cache operations.

#### Request

**URL:** `/api/schema`  
**Method:** `POST`  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "target": "sqlalchemy" | "snowflake",
  "action": "refresh" | "version"
}
```

**Parameters:**

- `target` (string, required): Database target type
- `action` (string, required): Action to perform
  - `"refresh"`: Clear schema cache for the target
  - `"version"`: Get cached schema version information

#### Response

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Schema cache cleared for sqlalchemy"
  },
  "error": null
}
```

**Version Check Response:**

```json
{
  "status": "success",
  "data": {
    "version": "1.0.0-mock-1234567890",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "error": null,
  "metadata": {
    "cached": true
  }
}
```

#### Example Requests

**Refresh Schema Cache:**

```bash
curl -X POST "http://localhost:3000/api/schema" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "sqlalchemy",
    "action": "refresh"
  }'
```

**Check Schema Version:**

```bash
curl -X POST "http://localhost:3000/api/schema" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "snowflake",
    "action": "version"
  }'
```

## Rate Limiting

Currently, there are no rate limits imposed. This may change in future versions.

## Examples

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/db/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Show me all active users',
    target: 'sqlalchemy'
  })
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests

response = requests.post('http://localhost:3000/api/db/query', json={
    'prompt': 'Show me all active users',
    'target': 'sqlalchemy'
})

result = response.json()
print(result)
```

### cURL

```bash
curl -X POST http://localhost:3000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all active users",
    "target": "sqlalchemy"
  }'
```

## Changelog

### v1.0.0

- Initial API release
- Support for SQLAlchemy and Snowflake databases
- Natural language query processing
- Error handling and validation

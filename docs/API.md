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
  "success": true,
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "query": "SELECT column1, column2 FROM table_name",
  "executionTime": 150
}
```

**Error Response (400/500):**

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
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

| Code | Description                               |
| ---- | ----------------------------------------- |
| 400  | Bad Request - Invalid request parameters  |
| 500  | Internal Server Error - Server-side error |

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

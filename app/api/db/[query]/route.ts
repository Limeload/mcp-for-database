import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueryRequest } from '@/app/types/database';
import {
  createSuccessResponse,
  createErrorResponse
} from '@/app/lib/api-response';

import { fetchWithRetry } from '@/app/lib/fetchWithRetry';

/**
 * API route handler for database queries
 * Forwards requests to the MCP server backend at http://localhost:8000/query
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    // Await params since it's a Promise in Next.js 15
    await params;

    // Parse the request body
    const body: DatabaseQueryRequest = await request.json();

    // Validate required fields
    if (!body.prompt || !body.target) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required fields: prompt and target are required',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Validate target value
    if (!['sqlalchemy', 'snowflake', 'sqlite'].includes(body.target)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid target: must be either "sqlalchemy", "snowflake", or "sqlite"',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Check if MCP server is available, otherwise use mock data for development
    let mcpData;
    let usedMock = false;
    try {
      const mcpResponse = await fetchWithRetry('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: body.prompt,
          target: body.target
        })
      });

      // Check if MCP server responded successfully
      if (!mcpResponse.ok) {
        throw new Error(
          `MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`
        );
      }

      // Parse MCP server response
      mcpData = await mcpResponse.json();
    } catch (error) {
      // MCP server not available, use mock data for development
      // eslint-disable-next-line no-console
      console.warn(
        'MCP server not available, using mock data:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      usedMock = true;

      mcpData = {
        data: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            created_at: '2024-01-15'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            created_at: '2024-01-20'
          },
          {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@example.com',
            created_at: '2024-01-25'
          }
        ],
        query: `-- Mock SQL query for: ${body.prompt}
SELECT id, name, email, created_at 
FROM users 
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC;`,
        executionTime: 45
      };
    }

    // Format response for frontend
    return NextResponse.json(
      createSuccessResponse(mcpData.data || [], {
        query: mcpData.query,
        executionTime: mcpData.executionTime,
        mocked: usedMock
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database query API error:', error);

    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

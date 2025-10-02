import { NextRequest, NextResponse } from 'next/server';
import {
  DatabaseQueryRequest,
  DatabaseQueryResponse,
  DatabaseErrorResponse
} from '@/app/types/database';

/**
 * API route handler for database queries with connection pooling
 * Now supports connection management and concurrent queries
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    // Await params since it's a Promise in Next.js 15
    await params;

    const body: DatabaseQueryRequest = await request.json();
    const { prompt, target, connectionId, maxExecutionTime } = body;

    // Validate required fields
    if (!prompt || !target) {
      return NextResponse.json<DatabaseErrorResponse>(
        {
          success: false,
          error: 'Missing required fields: prompt and target are required'
        },
        { status: 400 }
      );
    }

    // Validate target type
    if (!['sqlalchemy', 'snowflake'].includes(target)) {
      return NextResponse.json<DatabaseErrorResponse>(
        {
          success: false,
          error: 'Invalid target. Must be either "sqlalchemy" or "snowflake"'
        },
        { status: 400 }
      );
    }

    // Call MCP server with connection pooling support
    const mcpResponse = await fetch(`${request.nextUrl.origin}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'database_query',
          arguments: {
            prompt: prompt.trim(),
            target,
            connectionId,
            maxExecutionTime: maxExecutionTime || 30000
          }
        }
      })
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.status}`);
    }

    const mcpResult = await mcpResponse.json();

    if (mcpResult.error) {
      throw new Error(mcpResult.error);
    }

    // Parse the response from MCP server
    const result = JSON.parse(mcpResult.content[0].text);

    return NextResponse.json<DatabaseQueryResponse>(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database query error:', error);

    return NextResponse.json<DatabaseErrorResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for connection pool statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Call MCP server to get connection stats
    const mcpResponse = await fetch(`${request.nextUrl.origin}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'get_connection_stats',
          arguments: {}
        }
      })
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.status}`);
    }

    const mcpResult = await mcpResponse.json();
    const stats = JSON.parse(mcpResult.content[0].text);

    return NextResponse.json(stats);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting connection stats:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

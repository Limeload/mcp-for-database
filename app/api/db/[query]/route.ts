import { NextRequest, NextResponse } from 'next/server';
import {
  DatabaseQueryRequest,
  DatabaseQueryResponse,
  DatabaseErrorResponse
} from '@/app/types/database';

/**
 * API route handler for database queries with connection pooling
 * POST /api/db/query - Execute database query
 * GET /api/db/query - Get connection pool statistics
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;

    // Call MCP server with connection pooling support
    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      }),
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`);
    }

    const mcpResult = await mcpResponse.json();
    
    if (mcpResult.error) {
      throw new Error(mcpResult.error);
    }

    // Parse the response from MCP server
    const result = JSON.parse(mcpResult.content[0].text);

    return NextResponse.json<DatabaseQueryResponse>(result);

  } catch (error) {
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
 * GET /api/db/query - Get connection pool statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;

    // Call MCP server to get connection stats
    const mcpResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'get_connection_stats',
          arguments: {}
        }
      }),
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`);
    }

    const mcpResult = await mcpResponse.json();
    
    if (mcpResult.error) {
      throw new Error(mcpResult.error);
    }

    const stats = JSON.parse(mcpResult.content[0].text);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error getting connection stats:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

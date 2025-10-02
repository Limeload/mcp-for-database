import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueryRequest, DatabaseQueryResponse, DatabaseErrorResponse } from '@/app/types/database';

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
      const errorResponse: DatabaseErrorResponse = {
        success: false,
        error: 'Missing required fields: prompt and target are required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate target value
    if (!['sqlalchemy', 'snowflake'].includes(body.target)) {
      const errorResponse: DatabaseErrorResponse = {
        success: false,
        error: 'Invalid target: must be either "sqlalchemy" or "snowflake"'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Forward request to MCP server
    const mcpResponse = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: body.prompt,
        target: body.target
      }),
    });

    // Check if MCP server responded successfully
    if (!mcpResponse.ok) {
      const errorResponse: DatabaseErrorResponse = {
        success: false,
        error: `MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`
      };
      return NextResponse.json(errorResponse, { status: mcpResponse.status });
    }

    // Parse MCP server response
    const mcpData = await mcpResponse.json();
    
    // Format response for frontend
    const response: DatabaseQueryResponse = {
      success: true,
      data: mcpData.data || [],
      query: mcpData.query,
      executionTime: mcpData.executionTime
    };

    return NextResponse.json(response);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database query API error:', error);
    
    const errorResponse: DatabaseErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

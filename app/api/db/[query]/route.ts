import { NextRequest, NextResponse } from 'next/server';
import {
  DatabaseQueryRequest,
  DatabaseQueryResponse,
  DatabaseErrorResponse
} from '@/app/types/database';

/**
 * Suggestion helper: generate user-friendly tips based on error details
 */
function getSuggestion(details: string): string {
  if (!details) return "Check your query and try again.";

  const lower = details.toLowerCase();

  if (lower.includes("econnrefused")) {
    return "Could not connect to MCP server. Make sure it is running on http://localhost:8000.";
  }
  if (lower.includes("syntax")) {
    return "There seems to be a SQL syntax error. Double-check your query.";
  }
  if (lower.includes("no such table")) {
    return "The table you are querying does not exist. Verify the table name.";
  }
  if (lower.includes("timeout")) {
    return "The query took too long to execute. Try simplifying it or check server performance.";
  }

  return "Check your query and try again. If the issue persists, ensure the database and MCP server are configured correctly.";
}

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
      const errorResponse: DatabaseErrorResponse & { suggestion?: string } = {
        success: false,
        error: 'Missing required fields: prompt and target are required',
        suggestion: "Provide both 'prompt' (your query) and 'target' (sqlalchemy or snowflake)."
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate target value
    if (!['sqlalchemy', 'snowflake'].includes(body.target)) {
      const errorResponse: DatabaseErrorResponse & { suggestion?: string } = {
        success: false,
        error: 'Invalid target: must be either "sqlalchemy" or "snowflake"',
        suggestion: "Use 'sqlalchemy' for SQL queries or 'snowflake' for Snowflake database queries."
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Forward request to MCP server
    const mcpResponse = await fetch('http://localhost:8000/query', {
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
      const errorResponse: DatabaseErrorResponse & { suggestion?: string } = {
        success: false,
        error: `MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`,
        suggestion: "Ensure the MCP server is running and reachable at http://localhost:8000."
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
  } catch (error: any) {
    console.error('Database query API error:', error);

    const details =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error occurred';

    const errorResponse: DatabaseErrorResponse & { details?: string; suggestion?: string } = {
      success: false,
      error: "Database query failed",
      details,
      suggestion: getSuggestion(details)
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

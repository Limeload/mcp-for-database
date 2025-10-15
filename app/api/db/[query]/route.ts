import { NextRequest, NextResponse } from 'next/server';
import { DatabaseQueryRequest } from '@/app/types/database';
import {
  createSuccessResponse,
  createErrorResponse
} from '@/app/lib/api-response';
import {
  createLoggerWithCorrelation,
  generateCorrelationId,
  CORRELATION_ID_HEADER,
  safeTruncate
} from '@/app/lib/logger';
import { isWriteQuery } from '@/app/lib/sql/operation';
import { authorize } from '@/app/lib/auth/authorize';
import { authenticateRequest } from '@/app/lib/auth/authorize';
import { getCredentialStore } from '@/app/lib/database/credential-store';
import { generateConnectionString } from '@/app/lib/database/credentials';
import { decryptPassword } from '@/app/lib/database/encryption';

/**
 * Suggestion helper: generate user-friendly tips based on error details
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const incomingCorrelationId =
      request.headers.get(CORRELATION_ID_HEADER) || undefined;
    const correlationId = incomingCorrelationId || generateCorrelationId();
    const log = createLoggerWithCorrelation(correlationId, {
      route: '/api/db/[query]'
    });
    const startedAtMs = Date.now();

    // Await params since it's a Promise in Next.js 15
    await params;

    // Parse the request body safely (return 400 on invalid JSON)
    let body: DatabaseQueryRequest;
    try {
      body = (await request.json()) as DatabaseQueryRequest;
    } catch (err) {
      log.warn('query.invalid_json_body', {
        error: err instanceof Error ? err.message : String(err)
      });
      return NextResponse.json(
        createErrorResponse('Invalid JSON body', 'INVALID_JSON'),
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }

    // Validate required fields
    if (!body.prompt || !body.target) {
      log.warn('query.validation_failed', {
        reason: 'missing_fields',
        hasPrompt: Boolean(body.prompt),
        hasTarget: Boolean(body.target)
      });
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
      log.warn('query.validation_failed', {
        reason: 'invalid_target',
        target: body.target
      });
      return NextResponse.json(
        createErrorResponse(
          'Invalid target: must be either "sqlalchemy", "snowflake", or "sqlite"',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Handle credential-based queries
    let credentialId: string | undefined;
    let connectionString: string | undefined;
    
    if (body.credentialId) {
      credentialId = body.credentialId;
      const store = await getCredentialStore();
      const credential = await store.getCredentialById(credentialId, authResult.user.id);
      
      if (!credential) {
        return NextResponse.json(
          createErrorResponse('Credential not found', 'CREDENTIAL_NOT_FOUND'),
          { status: 404 }
        );
      }
      
      // Decrypt password and generate connection string
      const decryptedPassword = decryptPassword(credential.encryptedPassword);
      const connInfo = generateConnectionString(credential, decryptedPassword);
      connectionString = connInfo.connectionString;
      
      log.info('query.using_credential', {
        credentialId,
        credentialName: credential.name,
        credentialType: credential.type
      });
    }

    // Check if MCP server is available, otherwise use mock data for development
    let mcpData;
    let usedMock = false;
    const MCP_URL = 'http://localhost:8000/query';
    log.info('query.request_received', {
      target: body.target,
      promptLength: body.prompt.length,
      prompt: safeTruncate(body.prompt, 1000)
    });
    try {
      const mcpRequestBody: Record<string, unknown> = {
        prompt: body.prompt,
        target: body.target
      };
      
      // Include connection string if using credentials
      if (connectionString) {
        mcpRequestBody.connectionString = connectionString;
        mcpRequestBody.credentialId = credentialId;
      }
      
      const mcpResponse = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequestBody)
      });

      // Check if MCP server responded successfully
      if (!mcpResponse.ok) {
        throw new Error(
          `MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`
        );
      }

      // Parse MCP server response
      mcpData = await mcpResponse.json();

      // If query returned includes SQL text, enforce write permission if needed
      const sqlText = typeof mcpData.query === 'string' ? mcpData.query : '';
      if (sqlText && isWriteQuery(sqlText)) {
        const canWrite = await authorize('query:write');
        if (!canWrite.ok) return canWrite.response;
      }
    } catch (error) {
      // MCP server not available, use mock data for development
      // eslint-disable-next-line no-console
      log.warn('query.mcp_unavailable_using_mock', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
    const dataArray = Array.isArray(mcpData?.data) ? mcpData.data : [];
    const rowCount = dataArray.length;
    const columnCount =
      rowCount > 0 && dataArray[0] && typeof dataArray[0] === 'object'
        ? Object.keys(dataArray[0] as Record<string, unknown>).length
        : 0;
    const finishedAtMs = Date.now();
    const executionTimeMs =
      typeof mcpData?.executionTime === 'number'
        ? mcpData.executionTime
        : finishedAtMs - startedAtMs;

    log.info('query.executed', {
      target: body.target,
      usedMock,
      rowCount,
      columnCount,
      executionTimeMs,
      mcpReportedExecutionTimeMs: mcpData?.executionTime,
      queryLength: typeof mcpData?.query === 'string' ? mcpData.query.length : 0
    });

    const response = NextResponse.json(
      createSuccessResponse(mcpData.data || [], {
        query: mcpData.query,
        executionTime: executionTimeMs,
        mocked: usedMock,
        correlationId
      })
    );
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    const correlationId = generateCorrelationId();
    const log = createLoggerWithCorrelation(correlationId, {
      route: '/api/db/[query]'
    });
    log.error('query.error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response = NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'INTERNAL_ERROR',
        undefined,
        { correlationId }
      ),
      { status: 500 }
    );
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    return response;
  }
}

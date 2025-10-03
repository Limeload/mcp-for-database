import { NextRequest, NextResponse } from 'next/server';
import {
  DatabaseErrorResponse
} from '@/app/types/database';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

/**
 * POST /api/db/test-connection
 * Body: { target: 'sqlalchemy' | 'snowflake' | 'sqlite' }
 * Attempts to contact the MCP server to validate the connection for the requested target.
 * Falls back to a deterministic mock response when MCP server is unavailable (development).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target } = body || {};

    if (!target) {
      const errorResponse: DatabaseErrorResponse = {
        success: false,
        error: 'Missing required field: target is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }


    // Allow error simulation targets in non-production
    const allowedTargets = ['sqlalchemy', 'snowflake', 'sqlite'];
    const testTargets = ['authfail', 'tlsfail', 'slow'];
    const isTestTarget = testTargets.includes(target);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!allowedTargets.includes(target) && !(isDev && isTestTarget)) {
      const errorResponse: DatabaseErrorResponse = {
        success: false,
        error: 'Invalid target: must be either "sqlalchemy", "snowflake", or "sqlite"' + (isDev ? ', or a test target (authfail, tlsfail, slow)' : '')
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Try contacting MCP server for a real test, with a short timeout implemented via AbortController
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const start = Date.now();
      const mcpResponse = await fetch(`${MCP_SERVER_URL.replace(/\/$/, '')}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (!mcpResponse.ok) {
        const text = await mcpResponse.text().catch(() => '');
        throw new Error(`MCP server error: ${mcpResponse.status} ${mcpResponse.statusText} ${text}`);
      }

      interface MCPConnectionResult {
        success?: boolean;
        message?: string;
        error?: string;
        diagnostics?: { [k: string]: unknown } | null;
      }

      const data = (await mcpResponse.json()) as MCPConnectionResult;

      // Normalize response shape into { success, message, diagnostics }
      return NextResponse.json({
        success: true,
        message: data.message || 'Connection successful',
        diagnostics: { ...(data.diagnostics || {}), latencyMs: latency }
      });
    } catch (err) {
      // Fallback mock behaviour for dev
      // eslint-disable-next-line no-console
      console.warn('MCP test-connection not available, returning mock result:', err instanceof Error ? err.message : err);

      if (target === 'sqlite') {
        return NextResponse.json({
          success: true,
          message: 'Connected to local_dev.db (mock)',
          diagnostics: { ping: 10, db: 'sqlite', details: 'local_dev.db', latencyMs: 10 }
        });
      }

      return NextResponse.json({
        success: false,
        error: `Unable to reach MCP server to validate ${target}.`,
        diagnostics: {
          hint: `Ensure MCP-DB Connector is running at ${MCP_SERVER_URL} and reachable from this host.`,
          latencyMs: null
        }
      });
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Test connection API error:', error);
    const errorResponse: DatabaseErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

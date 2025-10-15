import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';

interface MockRequest {
  target?: string;
}

interface MockResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: Array<Record<string, unknown>>;
  sql?: string;
  query?: string;
  executionTime?: number;
  diagnostics?: {
    ping?: number;
    details?: string;
    latencyMs?: number;
    code?: string;
  };
}

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  // Basic request logging for easier local debugging
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url === '/test-connection') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        console.log(`[${now}] Request body: ${body}`);
      } catch (e) {
        /* ignore logging errors */
      }
      const p: MockRequest = JSON.parse(body || '{}');
      // Simulate auth failure
      if (p.target === 'authfail') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: 'Authentication failed',
            diagnostics: { code: 'AUTH_FAIL', details: 'Mocked auth error' }
          } as MockResponse)
        );
        return;
      }
      // Simulate TLS error
      if (p.target === 'tlsfail') {
        res.writeHead(495, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: 'TLS handshake failed',
            diagnostics: { code: 'TLS_ERROR', details: 'Mocked TLS error' }
          } as MockResponse)
        );
        return;
      }
      // Simulate slow response
      if (p.target === 'slow') {
        setTimeout(() => {
          const resp: MockResponse = {
            success: true,
            message: 'Mock OK for slow',
            diagnostics: { ping: 3000, details: 'mock slow', latencyMs: 3000 }
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(resp));
        }, 3000);
        return;
      }
      // Default: happy path
      const resp: MockResponse = {
        success: true,
        message: `Mock OK for ${p.target || 'unknown'}`,
        diagnostics: { ping: 12, details: 'mock', latencyMs: 12 }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/query') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
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
          sql: '-- Mock SQL query', // Always include 'sql' for UI compatibility
          query: '-- Mock SQL query', // Also include 'query' for legacy compatibility
          executionTime: 45
        } as MockResponse)
      );
    });
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<html><head><title>Mock MCP</title></head><body style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:2rem;line-height:1.6;color:#111">` +
        `<h1>Mock MCP Server</h1>` +
        `<p>This mock server provides the MCP endpoints used by the app for local development.</p>` +
        `<ul>` +
        `<li>POST <code>/test-connection</code> - expects JSON { target }</li>` +
        `<li>POST <code>/query</code> - expects a query body; returns mock rows</li>` +
        `</ul>` +
        `<p>Use the API endpoints from your app; the root page is just informational.</p>` +
        `</body></html>`
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.MOCK_MCP_PORT || 8000;
server.listen(PORT, () =>
  console.log(`Mock MCP listening on http://127.0.0.1:${PORT}`)
);

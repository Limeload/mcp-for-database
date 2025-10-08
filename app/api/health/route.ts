import { NextResponse } from 'next/server';

const serviceStartTime = Date.now();

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'SELECT 1',
        target: 'sqlalchemy'
      })
    });

    return res.ok;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection check failed:', error);
    return false;
  }
}

export async function GET() {
  const startTime = Date.now();

  const dbConnected = await checkDatabaseConnection();
  const upTimeInSeconds = Math.floor((Date.now() - serviceStartTime) / 1000);
  const responseTime = Date.now() - startTime;

  const status = dbConnected ? 'healthy' : 'unhealthy';
  const statusCode = dbConnected ? 200 : 503;

  const response = {
    status,
    upTime: `${upTimeInSeconds}s`,
    version: '1.0.0',
    responseTime: `${responseTime}ms`,
    database: dbConnected ? 'connected' : 'disconnected'
  };

  return NextResponse.json(response, { status: statusCode });
}

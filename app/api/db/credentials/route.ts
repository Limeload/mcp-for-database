import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth/authorize';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-response';
import { getCredentialStore } from '@/app/lib/database/credential-store';

/**
 * GET /api/db/credentials - List user's database credentials for query selection
 */
export async function GET() {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }
    
    const store = await getCredentialStore();
    const credentials = await store.getCredentialsByUserId(authResult.user.id);
    
    // Return credentials in a format suitable for query selection
    const credentialOptions = credentials.map(cred => ({
      id: cred.id,
      name: cred.name,
      type: cred.type,
      host: cred.host,
      port: cred.port,
      database: cred.database,
      username: cred.username,
      // Don't include sensitive information
      description: `${cred.name} (${cred.type}://${cred.username}@${cred.host}:${cred.port}/${cred.database})`
    }));
    
    return NextResponse.json(
      createSuccessResponse({ 
        credentials: credentialOptions,
        message: credentialOptions.length === 0 
          ? 'No database credentials configured. Create credentials to use custom database connections.'
          : `${credentialOptions.length} database credential(s) available.`
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch credentials',
        'FETCH_CREDENTIALS_ERROR'
      ),
      { status: 500 }
    );
  }
}

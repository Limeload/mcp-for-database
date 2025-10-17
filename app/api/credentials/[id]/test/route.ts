import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth/authorize';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-response';
import { getCredentialStore } from '@/app/lib/database/credential-store';
import { testDatabaseConnection } from '@/app/lib/database/connection-tester';

/**
 * POST /api/credentials/[id]/test - Test database connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }
    
    const { id } = await params;
    const store = await getCredentialStore();
    
    // Get the credential
    const credential = await store.getCredentialById(id, authResult.user.id);
    if (!credential) {
      return NextResponse.json(
        createErrorResponse('Credential not found', 'CREDENTIAL_NOT_FOUND'),
        { status: 404 }
      );
    }
    
    // Test the connection
    const result = await testDatabaseConnection(credential);
    
    return NextResponse.json(
      createSuccessResponse({ 
        testResult: result,
        credential: {
          id: credential.id,
          name: credential.name,
          type: credential.type,
          host: credential.host,
          port: credential.port,
          database: credential.database,
          username: credential.username,
        }
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to test connection',
        'TEST_CONNECTION_ERROR'
      ),
      { status: 500 }
    );
  }
}

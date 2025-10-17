import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/app/lib/auth/authorize';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-response';
import { getCredentialStore } from '@/app/lib/database/credential-store';

const UpdateCredentialSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().positive().optional(),
  database: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  ssl: z.boolean().optional(),
  schema: z.string().optional(),
  warehouse: z.string().optional(),
  role: z.string().optional(),
  account: z.string().optional(),
});

/**
 * GET /api/credentials/[id] - Get a specific credential
 */
export async function GET(
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
    const credential = await store.getCredentialById(id, authResult.user.id);
    
    if (!credential) {
      return NextResponse.json(
        createErrorResponse('Credential not found', 'CREDENTIAL_NOT_FOUND'),
        { status: 404 }
      );
    }
    
    // Return public credential (without encrypted password)
    const { encryptedPassword, ...publicCredential } = credential;
    void encryptedPassword; // Suppress unused variable warning
    
    return NextResponse.json(
      createSuccessResponse({ credential: publicCredential })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch credential',
        'FETCH_CREDENTIAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/credentials/[id] - Update a credential
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }
    
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateCredentialSchema.parse(body);
    
    const store = await getCredentialStore();
    const credential = await store.updateCredential(id, validatedData, authResult.user.id);
    
    return NextResponse.json(
      createSuccessResponse({ credential })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid request data',
          'VALIDATION_ERROR',
          error.flatten()
        ),
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Credential not found') {
      return NextResponse.json(
        createErrorResponse('Credential not found', 'CREDENTIAL_NOT_FOUND'),
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update credential',
        'UPDATE_CREDENTIAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/credentials/[id] - Delete a credential
 */
export async function DELETE(
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
    const deleted = await store.deleteCredential(id, authResult.user.id);
    
    if (!deleted) {
      return NextResponse.json(
        createErrorResponse('Credential not found', 'CREDENTIAL_NOT_FOUND'),
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      createSuccessResponse({ message: 'Credential deleted successfully' })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete credential',
        'DELETE_CREDENTIAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

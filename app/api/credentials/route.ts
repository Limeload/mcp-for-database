import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/app/lib/auth/authorize';
import { createErrorResponse, createSuccessResponse } from '@/app/lib/api-response';
import { getCredentialStore } from '@/app/lib/database/credential-store';
import { DATABASE_TYPES } from '@/app/lib/database/credentials';

// Validation schemas
const CreateCredentialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(DATABASE_TYPES),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive('Port must be a positive integer'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().optional(),
  schema: z.string().optional(),
  warehouse: z.string().optional(),
  role: z.string().optional(),
  account: z.string().optional(),
});


/**
 * GET /api/credentials - List user's database credentials
 */
export async function GET() {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }
    
    const store = await getCredentialStore();
    const credentials = await store.getCredentialsByUserId(authResult.user.id);
    
    return NextResponse.json(
      createSuccessResponse({ credentials })
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

/**
 * POST /api/credentials - Create a new database credential
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.ok) {
      return authResult.response;
    }
    
    const body = await request.json();
    const validatedData = CreateCredentialSchema.parse(body);
    
    const store = await getCredentialStore();
    const credential = await store.createCredential(validatedData, authResult.user.id);
    
    return NextResponse.json(
      createSuccessResponse({ credential }),
      { status: 201 }
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
    
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create credential',
        'CREATE_CREDENTIAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

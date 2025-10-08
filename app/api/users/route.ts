import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorize } from '@/app/lib/auth/authorize';
import {
  createErrorResponse,
  createSuccessResponse
} from '@/app/lib/api-response';
import { getStore } from '@/app/lib/auth/store';
import { USER_ROLES } from '@/app/types/auth';

const CreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(USER_ROLES),
  password: z.string().min(8)
});

const UpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(USER_ROLES).optional(),
  password: z.string().min(8).optional()
});

export async function GET() {
  const auth = await authorize('users:list');
  if (!auth.ok) return auth.response;
  const store = await getStore();
  const users = await store.listUsers();
  return NextResponse.json(createSuccessResponse({ users }));
}

export async function POST(request: NextRequest) {
  const auth = await authorize('users:create');
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const input = CreateSchema.parse(body);
    const store = await getStore();
    const user = await store.createUser(input);
    return NextResponse.json(createSuccessResponse({ user }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid request body',
          'VALIDATION_ERROR',
          error.flatten()
        ),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse('Failed to create user', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authorize('users:update');
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        createErrorResponse('Missing id', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    const body = await request.json();
    const input = UpdateSchema.parse(body);
    const store = await getStore();
    const user = await store.updateUser(id, input);
    await store.bumpTokenVersion(id);
    return NextResponse.json(createSuccessResponse({ user }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid request body',
          'VALIDATION_ERROR',
          error.flatten()
        ),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse('Failed to update user', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize('users:delete');
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        createErrorResponse('Missing id', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    const store = await getStore();
    const ok = await store.deleteUser(id);
    return NextResponse.json(createSuccessResponse({ deleted: ok }));
  } catch {
    return NextResponse.json(
      createErrorResponse('Failed to delete user', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

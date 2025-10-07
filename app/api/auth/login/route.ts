import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse
} from '@/app/lib/api-response';
import { getStore } from '@/app/lib/auth/store';
import { verifyPassword } from '@/app/lib/auth/password';
import { issueJwt, setSessionCookie } from '@/app/lib/auth/jwt';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);
    const store = await getStore();
    const user = await store.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials', 'AUTH_FAILED'),
        { status: 401 }
      );
    }
    const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials', 'AUTH_FAILED'),
        { status: 401 }
      );
    }
    const token = await issueJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    await setSessionCookie(token);
    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    );
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
      createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}

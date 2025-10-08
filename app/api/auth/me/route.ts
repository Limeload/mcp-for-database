import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/app/lib/api-response';
import { authenticateRequest } from '@/app/lib/auth/authorize';

export async function GET() {
  const auth = await authenticateRequest();
  if (!auth.ok) return auth.response;
  return NextResponse.json(createSuccessResponse({ user: auth.user }));
}

import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/app/lib/api-response';
import { clearSessionCookie } from '@/app/lib/auth/jwt';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json(createSuccessResponse({ success: true }));
}

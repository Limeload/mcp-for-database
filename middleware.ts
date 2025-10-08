import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require auth
const PUBLIC_PATHS = [
  '/',
  '/learn-more',
  '/api/health',
  '/api/auth/login',
  '/api/mcp'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Let API routes handle auth themselves; we only gate app pages
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For now, allow pages without session check; UI can call /api/auth/me
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)']
};

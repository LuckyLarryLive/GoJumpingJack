import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that require authentication (handled by individual API routes)
const protectedPaths = ['/account'];

// Add paths that should be accessible without authentication
const publicPaths = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/duffel/airlines',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-email-required',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(prefix => path.startsWith(prefix));
  const isPublicPath = publicPaths.some(prefix => path.startsWith(prefix));

  if (!isProtectedPath && !isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, check if auth token exists (detailed verification in API routes)
  if (isProtectedPath) {
    // Check for cookie-based authentication first
    const authToken = request.cookies.get('auth_token')?.value;

    if (authToken) {
      return NextResponse.next();
    }

    // Fallback to Authorization header for API calls
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return NextResponse.next();
    }

    // Redirect to login for page routes, return 401 for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/account/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};

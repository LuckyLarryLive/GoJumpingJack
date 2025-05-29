import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Add paths that require authentication
const protectedPaths = [
  '/api/user',
  '/account',
];

// Add paths that should be accessible without authentication
const publicPaths = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/duffel/airlines',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(prefix => path.startsWith(prefix));
  const isPublicPath = publicPaths.some(prefix => path.startsWith(prefix));

  if (!isProtectedPath && !isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, verify authentication
  if (isProtectedPath) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    try {
      verifyToken(token);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
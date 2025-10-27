import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define role-based route prefixes
const ROLE_ROUTES = {
  platform_admin: '/platform-admin',
  ent_admin: '/ent-admin',
  decider: '/decider',
  employee: '/employee',
  shop_admin: '/shop-admin',
  cashier: '/cashier',
  collaborator: '/collaborator',
  user: '/user',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if user is accessing a role-specific route
  const roleRoute = Object.values(ROLE_ROUTES).find(route => pathname.startsWith(route));
  
  if (roleRoute) {
    // In a real app, you would check the user's role from a session/cookie
    // For now, we'll allow access (role checking will be done client-side)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

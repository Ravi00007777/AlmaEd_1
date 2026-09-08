import { auth } from '@/lib/auth/auth-options';
import { NextResponse } from 'next/server';

const publicRoutes = ['/', '/login', '/register', '/teachers', '/teachers/[id]', '/api/auth', '/api/google'];
const authRoutes = ['/login', '/register'];

const roleRoutes: Record<string, string[]> = {
  STUDENT: ['/student', '/api/student'],
  TEACHER: ['/teacher', '/api/teacher'],
  ADMIN: ['/admin', '/api/admin'],
  PARENT: ['/parent', '/api/parent'],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes('[')) {
      // Handle dynamic routes
      const regex = new RegExp(`^${route.replace(/\[.*?\]/g, '[^/]+')}$`);
      return regex.test(nextUrl.pathname);
    }
    return nextUrl.pathname === route || nextUrl.pathname.startsWith(route + '/');
  });

  // Check if route is an auth route
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // Redirect logged in users from auth pages
  if (isLoggedIn && isAuthRoute) {
    if (!userRole) {
      return NextResponse.redirect(new URL('/student/dashboard', nextUrl));
    }
    const dashboardUrl = getDashboardUrl(userRole);
    return NextResponse.redirect(new URL(dashboardUrl, nextUrl));
  }

  // Redirect non-logged in users from protected routes
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (isLoggedIn && userRole) {
    const allowedRoutes = roleRoutes[userRole] || [];
    const isAllowed = allowedRoutes.some((route) => nextUrl.pathname.startsWith(route));
    const isPublicApi = nextUrl.pathname.startsWith('/api/') && 
      ['/api/auth', '/api/google', '/api/webhooks'].some(p => nextUrl.pathname.startsWith(p));

    if (!isAllowed && !isPublicApi && !nextUrl.pathname.startsWith('/api/')) {
      // Redirect to appropriate dashboard
      const dashboardUrl = getDashboardUrl(userRole);
      return NextResponse.redirect(new URL(dashboardUrl, nextUrl));
    }
  }

  return NextResponse.next();
});

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'TEACHER':
      return '/teacher/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    case 'PARENT':
      return '/parent/dashboard';
    default:
      return '/student/dashboard';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
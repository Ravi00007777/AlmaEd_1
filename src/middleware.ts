import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

const roleHome: Record<string, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

const publicRoutes = ['/', '/login', '/register'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  // '/' included here too: a logged-in user has no reason to see the
  // marketing landing page — send them straight to their dashboard.
  const isRouteToLeaveOnLogin =
    nextUrl.pathname === '/' || nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  if (isLoggedIn && isRouteToLeaveOnLogin && role) {
    return NextResponse.redirect(new URL(roleHome[role], nextUrl));
  }

  if (isLoggedIn && role) {
    const ownSection = `/${role.toLowerCase()}`;
    const isAdminRoute = nextUrl.pathname.startsWith('/admin');
    const isTeacherRoute = nextUrl.pathname.startsWith('/teacher');
    const isStudentRoute = nextUrl.pathname.startsWith('/student');

    if (
      (isAdminRoute || isTeacherRoute || isStudentRoute) &&
      !nextUrl.pathname.startsWith(ownSection)
    ) {
      return NextResponse.redirect(new URL(roleHome[role], nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

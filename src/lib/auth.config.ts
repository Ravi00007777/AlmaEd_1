import type { NextAuthConfig } from 'next-auth';

// Edge-safe subset of the auth config — no Credentials provider here (it
// pulls in bcryptjs and Prisma, both Node-only). src/middleware.ts runs in
// the Edge Runtime and only needs to read the JWT session, not verify a
// password, so it uses this config directly instead of the full one in
// src/lib/auth.ts.
export const authConfig: NextAuthConfig = {
  // Vercel is auto-trusted by Auth.js; other hosts (Render, Railway, etc.)
  // need this explicitly, or every request throws UntrustedHost. Safe here
  // since NEXTAUTH_URL is always set to our own real deployed domain, not
  // user-controlled.
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ADMIN' | 'TEACHER' | 'STUDENT';
      }
      return session;
    },
  },
};

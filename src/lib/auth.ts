import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string') return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // No passwordHash means this account was created via Google sign-in
        // and never set a password — credentials login must reject it, not
        // crash trying to bcrypt.compare against null.
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // All accounts (teacher and student alike) are created by admin — there
    // is no public signup. Google sign-in is just an alternative login for
    // an existing student account matching that email; an unrecognized
    // email or a teacher/admin email must be rejected, never auto-created.
    signIn: async ({ user, account }) => {
      if (account?.provider !== 'google') return true;
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      return existing?.role === 'STUDENT';
    },
    jwt: async ({ token, user, account }) => {
      if (user && account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      } else if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
  },
});

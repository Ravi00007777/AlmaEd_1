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
    // Google sign-in is students-only: teachers/admin are vetted and
    // created by admin, so a Google account matching their email must not
    // grant access. A new email via Google auto-registers as a student.
    signIn: async ({ user, account }) => {
      if (account?.provider !== 'google') return true;
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) return existing.role === 'STUDENT';

      await prisma.user.create({
        data: { name: user.name ?? user.email, email: user.email, role: 'STUDENT' },
      });
      return true;
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

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// TEMPORARY: this session's stale Prisma Client predates the isActive
// column — same root cause as src/lib/doubts.ts. Putting `isActive` inside
// a typed prisma.user.* where/select clause would throw
// PrismaClientValidationError, so these raw-SQL helpers are used only at
// the specific call sites that need isActive, leaving every other
// existing prisma.user.* call untouched. Delete once the server has
// restarted and prisma.user.* knows about isActive directly.

export async function getInactiveUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "User" WHERE id IN (${Prisma.join(userIds)}) AND "isActive" = false
  `;
  return new Set(rows.map((r) => r.id));
}

export async function isUserActive(userId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ isActive: boolean }[]>`
    SELECT "isActive" FROM "User" WHERE id = ${userId}
  `;
  return rows[0]?.isActive ?? true;
}

export async function deactivateUser(userId: string): Promise<void> {
  await prisma.$executeRaw`UPDATE "User" SET "isActive" = false WHERE id = ${userId}`;
}

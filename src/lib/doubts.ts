import { prisma } from '@/lib/prisma';

// TEMPORARY: this session's long-running dev server has a stale in-memory
// Prisma Client that predates the DoubtMessage migration, so
// `prisma.doubtMessage` doesn't exist on it yet — same root cause as
// src/lib/resource-due-dates.ts. Raw SQL bypasses that. Delete this file's
// raw-SQL bodies and call prisma.doubtMessage.* directly once the server
// has restarted at least once after this schema change.

export type DoubtMessageRow = {
  id: string;
  batchId: string;
  studentId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string | null;
  imageUrl: string | null;
  createdAt: Date;
};

export async function getDoubtThread(batchId: string, studentId: string): Promise<DoubtMessageRow[]> {
  return prisma.$queryRaw<DoubtMessageRow[]>`
    SELECT m.id, m."batchId", m."studentId", m."senderId",
           u.name AS "senderName", u.role AS "senderRole",
           m.body, m."imageUrl", m."createdAt"
    FROM "DoubtMessage" m
    JOIN "User" u ON u.id = m."senderId"
    WHERE m."batchId" = ${batchId} AND m."studentId" = ${studentId}
    ORDER BY m."createdAt" ASC
  `;
}

export async function getDoubtCounts(batchId: string): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ studentId: string; count: bigint }[]>`
    SELECT "studentId", COUNT(*) as count
    FROM "DoubtMessage"
    WHERE "batchId" = ${batchId}
    GROUP BY "studentId"
  `;
  return Object.fromEntries(rows.map((r) => [r.studentId, Number(r.count)]));
}

export async function createDoubtMessage(data: {
  batchId: string;
  studentId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
}): Promise<void> {
  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "DoubtMessage" (id, "batchId", "studentId", "senderId", body, "imageUrl", "createdAt")
    VALUES (${id}, ${data.batchId}, ${data.studentId}, ${data.senderId}, ${data.body}, ${data.imageUrl}, now())
  `;
}

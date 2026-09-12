import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// TEMPORARY diagnostic: list recent resources for the Grade 8 Math batch
// to debug why an upload didn't show up. Delete after use.
export async function GET() {
  const rows = await prisma.$queryRaw`
    SELECT id, title, type, "fileUrl", "createdAt"
    FROM "Resource"
    WHERE "batchId" = 'cmtxq5mmr0004n1dsud7p3uwb'
    ORDER BY "createdAt" DESC
  `;
  return NextResponse.json(rows);
}

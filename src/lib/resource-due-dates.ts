import { prisma } from '@/lib/prisma';

// TEMPORARY: the running dev server's Prisma Client predates the migration
// that added `dueAt` on Resource, so the normal typed query API silently
// omits it. Raw SQL sidesteps that. Delete this file and read `dueAt`
// directly off `prisma.resource`/`prisma.batch...resources` results once
// the server has been restarted at least once since that migration — see
// LESSONS.md.
export async function attachResourceDueDates<T extends { id: string }>(
  resources: T[]
): Promise<(T & { dueAt: Date | null })[]> {
  if (resources.length === 0) return [];

  const rows = await prisma.$queryRaw<{ id: string; dueAt: Date | null }[]>`
    SELECT id, "dueAt" FROM "Resource" WHERE id = ANY(${resources.map((r) => r.id)})
  `;
  const dueAtById = new Map(rows.map((row) => [row.id, row.dueAt]));

  return resources.map((resource) => ({
    ...resource,
    dueAt: dueAtById.get(resource.id) ?? null,
  }));
}

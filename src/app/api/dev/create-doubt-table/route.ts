import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMPORARY route, already used once to create the DoubtMessage table
// against the live DB (this session's shell is broken — see LESSONS.md).
// Disabled after use. Delete this file entirely once shell access is
// restored, matching src/app/api/dev/update-admin/route.ts's convention.
export async function GET() {
  return NextResponse.json({ error: 'Disabled' }, { status: 410 });
}

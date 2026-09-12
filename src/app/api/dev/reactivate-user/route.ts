import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMPORARY route, already used once to fix an accidental removal.
// Disabled after use. Delete this file entirely once shell access is
// restored.
export async function GET() {
  return NextResponse.json({ error: 'Disabled' }, { status: 410 });
}

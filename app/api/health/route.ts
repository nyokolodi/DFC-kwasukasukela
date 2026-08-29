import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    const db = await createClient();
    const { error } = await db.from('story_catalog').select('id').limit(1);
    checks.supabase = error ? 'error' : 'ok';
    if (error) checks.supabase_error = error.message;
  } catch (error) {
    checks.supabase = 'error';
    checks.supabase_error = error instanceof Error ? error.message : 'unknown';
  }

  checks.livekit = process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
    ? 'configured'
    : 'not_configured';

  const ok = checks.supabase === 'ok';
  return NextResponse.json(
    {
      ok,
      service: 'digital-fire-circle',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}

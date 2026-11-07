import { NextResponse } from 'next/server';
import { createClient, getServerUser } from '@/lib/supabase/server';
import { whopConfigured } from '@/lib/whop';

export async function GET() {
  if (!await getServerUser()) return NextResponse.json({ error: 'Sign in.' }, { status: 401 });
  const { data, error } = await (await createClient()).rpc('bloomshield_plan');
  if (error) return NextResponse.json({ error: 'Plan unavailable.' }, { status: 503 });
  return NextResponse.json({ ...data, checkoutAvailable: whopConfigured() });
}

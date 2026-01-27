import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  console.log('🔐 Auth callback triggered with code:', code ? 'present' : 'missing');

  if (code) {
    try {
      const supabase = createServerClient();

      // Exchange the auth code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('❌ Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
      }

      console.log('✅ Auth callback successful for user:', data.user?.email);

      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(`${origin}/dashboard`);
    } catch (error) {
      console.error('❌ Auth callback exception:', error);
      return NextResponse.redirect(`${origin}/?error=verification_failed`);
    }
  }

  console.log('⚠️ No auth code provided, redirecting to home');
  // If no code, redirect to home
  return NextResponse.redirect(origin);
}

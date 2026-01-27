import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route
 * Handles OAuth redirects and email verification links
 * Properly exchanges the code for a session and sets cookies
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        // For local development, use origin directly
        return NextResponse.redirect(`${origin}${next}?verified=true`);
      } else if (forwardedHost) {
        // For production with proxy/load balancer
        return NextResponse.redirect(`https://${forwardedHost}${next}?verified=true`);
      } else {
        return NextResponse.redirect(`${origin}${next}?verified=true`);
      }
    }

    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}?error=auth_callback_failed`);
  }

  // Return to origin if no code present
  return NextResponse.redirect(`${origin}?error=no_code`);
}

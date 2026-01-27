import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase Client
 * Use this in React components (client-side)
 * Handles cookie-based sessions automatically
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side usage - lazy loaded
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    // Return a dummy client for SSR/build time that will be replaced on client
    return null as any;
  }

  if (!browserClient) {
    browserClient = createClient();
    console.log('Supabase browser client initialized');
  }
  return browserClient;
}

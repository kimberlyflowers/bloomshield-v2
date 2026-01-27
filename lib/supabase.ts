/**
 * Supabase Client - Backwards Compatibility Export
 *
 * This file provides backwards compatibility for code that imports
 * from '@/lib/supabase'. It uses the new SSR-compatible browser client.
 *
 * For new code:
 * - Use '@/lib/supabase/client' for browser/client components
 * - Use '@/lib/supabase/server' for API routes and server components
 */

import { getSupabaseBrowserClient, createClient } from './supabase/client';

// Create a proxy object for backwards compatibility
// The actual client is only created when a property is accessed
const createSupabaseProxy = () => {
  let client: any = null;

  return new Proxy({} as any, {
    get(_target, prop) {
      if (typeof window === 'undefined') {
        // During SSR, return undefined for all properties
        return undefined;
      }

      if (!client) {
        client = getSupabaseBrowserClient();
      }
      return client?.[prop];
    }
  });
};

// Export the proxy for backwards compatibility
export const supabase = createSupabaseProxy();

// Re-export the utility functions
export { getSupabaseBrowserClient, createClient };

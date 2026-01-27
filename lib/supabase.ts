import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Missing Supabase environment variables. Auth features will not work.');
  }
}

// SINGLETON Supabase client - initialized ONCE
// This prevents "Multiple GoTrueClient instances" errors
export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'bloomshield-auth-token'
      }
    })
  : null as any;

// Log initialization (only once)
if (typeof window !== 'undefined' && supabase) {
  console.log('✅ Supabase client initialized (singleton)');
}

// Legacy compatibility: export as default too
export default supabase;

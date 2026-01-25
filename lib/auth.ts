import { authClient } from './better-auth-client';
import { createClient } from './supabase';
import { SignUpData, LoginData, UserProfile, AuthError } from '@/types/user';

// Check if Better Auth is configured
const isBetterAuthConfigured = () => {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres';
};

export function generateUserWallet() {
  const address = '0x' + Array.from({ length: 40 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');

  const wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract'];
  const seedPhrase = [];
  for (let i = 0; i < 12; i++) {
    seedPhrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }

  return { address, seedPhrase: seedPhrase.join(' ') };
}

// Supabase Auth fallback functions
async function signUpWithSupabase({ email, password, name }: SignUpData) {
  const supabase = createClient();

  // Generate wallet for new user
  const wallet = generateUserWallet();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split('@')[0]
      }
    }
  });

  if (authError) return { success: false, error: { message: authError.message } };
  if (!authData.user) return { success: false, error: { message: 'Failed to create user' } };

  // Create user profile
  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    name: name || email.split('@')[0],
    wallet_address: wallet.address,
    wallet_seed_phrase: wallet.seedPhrase,
    account_type: 'free',
    role: 'creator',
    email_verified: false,
    two_factor_enabled: false,
    created_at: new Date().toISOString()
  });

  if (profileError) {
    console.error('Profile creation error:', profileError);
  }

  return { success: true, userId: authData.user.id };
}

async function loginWithSupabase({ email, password }: LoginData) {
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) return { success: false, error: { message: authError.message } };
  if (!authData.user) return { success: false, error: { message: 'Login failed' } };

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    // Create profile if it doesn't exist
    const wallet = generateUserWallet();
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: authData.user.email!,
      name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
      wallet_address: wallet.address,
      wallet_seed_phrase: wallet.seedPhrase,
      account_type: 'free',
      role: 'creator',
      email_verified: !!authData.user.email_confirmed_at,
      two_factor_enabled: false,
      created_at: authData.user.created_at
    });

    if (insertError) {
      console.error('Failed to create profile:', insertError);
    }

    // Fetch the newly created profile
    const { data: newProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (newProfile) {
      const userProfile: UserProfile = {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        walletAddress: newProfile.wallet_address,
        walletSeedPhrase: newProfile.wallet_seed_phrase,
        createdAt: newProfile.created_at,
        accountType: newProfile.account_type,
        role: newProfile.role,
        emailVerified: newProfile.email_verified,
        twoFactorEnabled: newProfile.two_factor_enabled
      };
      return { success: true, user: userProfile };
    }
  }

  const userProfile: UserProfile = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    walletAddress: profile.wallet_address,
    walletSeedPhrase: profile.wallet_seed_phrase,
    createdAt: profile.created_at,
    accountType: profile.account_type,
    role: profile.role,
    emailVerified: profile.email_verified,
    twoFactorEnabled: profile.two_factor_enabled
  };

  return { success: true, user: userProfile };
}

async function getCurrentUserProfileSupabase(): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    walletAddress: profile.wallet_address,
    walletSeedPhrase: profile.wallet_seed_phrase,
    createdAt: profile.created_at,
    accountType: profile.account_type,
    role: profile.role,
    emailVerified: profile.email_verified,
    twoFactorEnabled: profile.two_factor_enabled
  };
}

async function logoutSupabase() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: { message: error.message } };
  return { success: true };
}

// Better Auth functions (with fallback)
async function signUpWithBetterAuth({ email, password, name }: SignUpData) {
  try {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name
    });

    if (error) return { success: false, error: { message: error.message || 'Sign up failed' } };
    return { success: true, userId: data?.user?.id };
  } catch (error: any) {
    console.error('Better Auth signup error:', error);
    throw error;
  }
}

async function loginWithBetterAuth({ email, password }: LoginData) {
  try {
    const { data, error } = await authClient.signIn.email({ email, password });

    if (error) return { success: false, error: { message: error.message || 'Login failed' } };
    if (!data?.user) return { success: false, error: { message: 'Login failed - no user data' } };

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || data.user.email.split('@')[0],
      walletAddress: (data.user as any).walletAddress || '',
      walletSeedPhrase: (data.user as any).walletSeedPhrase || '',
      createdAt: new Date(data.user.createdAt).toISOString(),
      accountType: (data.user as any).accountType || 'free',
      role: (data.user as any).role || 'creator',
      emailVerified: data.user.emailVerified,
      twoFactorEnabled: false
    };

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error('Better Auth login error:', error);
    throw error;
  }
}

async function getCurrentUserProfileBetterAuth(): Promise<UserProfile | null> {
  try {
    const { data } = await authClient.getSession();
    if (!data?.user) return null;

    const user = data.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      walletAddress: (user as any).walletAddress || '',
      walletSeedPhrase: (user as any).walletSeedPhrase || '',
      createdAt: new Date(user.createdAt).toISOString(),
      accountType: (user as any).accountType || 'free',
      role: (user as any).role || 'creator',
      emailVerified: user.emailVerified,
      twoFactorEnabled: false
    };
  } catch (error) {
    return null;
  }
}

async function logoutBetterAuth() {
  try {
    await authClient.signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'Logout failed' } };
  }
}

// Public API with hybrid fallback logic
export async function signUp({ email, password, name }: SignUpData): Promise<{ success: boolean; error?: AuthError; userId?: string }> {
  try {
    // Try Better Auth first if configured
    if (isBetterAuthConfigured()) {
      try {
        return await signUpWithBetterAuth({ email, password, name });
      } catch (betterAuthError) {
        console.log('Better Auth not available, falling back to Supabase Auth');
      }
    }

    // Fallback to Supabase Auth
    return await signUpWithSupabase({ email, password, name });
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'An unexpected error occurred' } };
  }
}

export async function login({ email, password }: LoginData): Promise<{ success: boolean; error?: AuthError; user?: UserProfile }> {
  try {
    // Try Better Auth first if configured
    if (isBetterAuthConfigured()) {
      try {
        return await loginWithBetterAuth({ email, password });
      } catch (betterAuthError) {
        console.log('Better Auth not available, falling back to Supabase Auth');
      }
    }

    // Fallback to Supabase Auth
    return await loginWithSupabase({ email, password });
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'An unexpected error occurred' } };
  }
}

export async function logout(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    // Try both auth systems
    if (isBetterAuthConfigured()) {
      try {
        await logoutBetterAuth();
      } catch (e) {
        // Ignore Better Auth errors
      }
    }

    return await logoutSupabase();
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'Logout failed' } };
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    // Try Better Auth first if configured
    if (isBetterAuthConfigured()) {
      try {
        const profile = await getCurrentUserProfileBetterAuth();
        if (profile) return profile;
      } catch (betterAuthError) {
        // Fall through to Supabase
      }
    }

    // Fallback to Supabase Auth
    return await getCurrentUserProfileSupabase();
  } catch (error) {
    return null;
  }
}

export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  // Use Supabase's real-time auth state changes
  const supabase = createClient();

  // Initial load
  getCurrentUserProfile().then(callback);

  // Subscribe to auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, _session) => {
    const user = await getCurrentUserProfile();
    callback(user);
  });

  return { unsubscribe: () => subscription.unsubscribe() };
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: { message: error.message } };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: { message: error.message } };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function getSession() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    return null;
  }
}

import { getSupabaseBrowserClient } from './supabase/client';
import { SignUpData, LoginData, UserProfile, AuthError } from '@/types/user';

/**
 * Get the Supabase browser client
 * Uses the SSR-compatible client for proper cookie handling
 */
function getClient() {
  return getSupabaseBrowserClient();
}

/**
 * Convert Supabase auth user to UserProfile
 * Creates profile from auth metadata - no database query needed
 */
function authUserToProfile(user: any): UserProfile {
  const userId = user.id || '';
  const userEmail = user.email || '';
  const userName = user.user_metadata?.name || userEmail.split('@')[0] || 'User';


  return {
    id: userId,
    email: userEmail,
    name: userName,
    walletAddress: '',
    walletSeedPhrase: '',
    createdAt: user.created_at || new Date().toISOString(),
    accountType: user.user_metadata?.account_type || 'free',
    role: user.user_metadata?.role || 'creator',
    phone: user.user_metadata?.phone,
    bio: user.user_metadata?.bio,
    profilePhoto: user.user_metadata?.profile_photo,
    businessName: user.user_metadata?.business_name,
    businessWebsite: user.user_metadata?.business_website,
    industry: user.user_metadata?.industry,
    socialLinks: user.user_metadata?.social_links,
    emailVerified: !!user.email_confirmed_at,
    twoFactorEnabled: user.user_metadata?.two_factor_enabled || false
  };
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password, name }: SignUpData): Promise<{ success: boolean; error?: AuthError; userId?: string }> {
  try {
    const supabase = getClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          terms_version: '2026-11-07',
          account_type: 'free',
          role: 'creator'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      return {
        success: false,
        error: {
          message: authError.message,
          code: authError.status?.toString()
        }
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: { message: 'Failed to create user' }
      };
    }

    return {
      success: true,
      userId: authData.user.id
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred'
      }
    };
  }
}

/**
 * Log in existing user
 */
export async function login({ email, password }: LoginData): Promise<{ success: boolean; error?: AuthError; user?: UserProfile }> {
  try {
    const supabase = getClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return {
        success: false,
        error: {
          message: authError.message,
          code: authError.status?.toString()
        }
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: { message: 'Login failed' }
      };
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          code: 'email_not_verified'
        }
      };
    }

    const userProfile = authUserToProfile(authData.user);

    return {
      success: true,
      user: userProfile
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred during login'
      }
    };
  }
}

/**
 * Log out current user
 */
export async function logout(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = getClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to log out'
      }
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to send reset email'
      }
    };
  }
}

/**
 * Update password (when user is logged in)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = getClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to update password'
      }
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = getClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return authUserToProfile(user);
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 * Uses auth metadata directly - no database queries
 */
export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  const supabase = getClient();

  return supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    console.log('Auth state changed:', event);

    if (session?.user) {
      const profile = authUserToProfile(session.user);
      callback(profile);
    } else {
      callback(null);
    }
  });
}

/**
 * Update user profile metadata
 */
export async function updateUserProfile(data: Partial<UserProfile>): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const supabase = getClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        profile_photo: data.profilePhoto,
        business_name: data.businessName,
        business_website: data.businessWebsite,
        industry: data.industry,
        social_links: data.socialLinks
      }
    });

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to update profile'
      }
    };
  }
}

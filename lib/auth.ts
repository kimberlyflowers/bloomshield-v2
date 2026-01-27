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
 * Generate wallet for new user
 */
export function generateUserWallet() {
  const address = '0x' + Array.from({ length: 40 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');

  const wordList = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
    'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
    'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha',
    'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount',
    'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal',
    'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
    'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch',
    'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army',
    'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist',
    'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma',
    'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
    'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid',
    'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby',
    'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo',
    'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic',
    'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef',
    'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench',
    'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid',
    'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade',
    'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom',
    'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil',
    'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow',
    'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand',
    'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright',
    'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown',
    'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk',
    'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business',
    'busy', 'butter', 'buyer', 'buzz'
  ];

  const seedPhrase = [];
  for (let i = 0; i < 12; i++) {
    seedPhrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }

  return {
    address,
    seedPhrase: seedPhrase.join(' ')
  };
}

/**
 * Convert Supabase auth user to UserProfile
 * Creates profile from auth metadata - no database query needed
 */
function authUserToProfile(user: any): UserProfile {
  const userId = user.id || '';
  const userEmail = user.email || '';
  const userName = user.user_metadata?.name || userEmail.split('@')[0] || 'User';

  // Generate deterministic wallet address from user ID
  const walletAddress = '0x' + (userId.replace(/-/g, '') + '0'.repeat(40)).substring(0, 40);

  return {
    id: userId,
    email: userEmail,
    name: userName,
    walletAddress,
    walletSeedPhrase: user.user_metadata?.wallet_seed_phrase || '',
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
    const wallet = generateUserWallet();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          wallet_address: wallet.address,
          wallet_seed_phrase: wallet.seedPhrase,
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
      redirectTo: `${window.location.origin}/auth/reset-password`
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

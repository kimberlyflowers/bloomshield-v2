import { supabase } from './supabase';
import { SignUpData, LoginData, UserProfile, AuthError } from '@/types/user';

// Generate wallet for new user
export function generateUserWallet() {
  // Generate wallet address
  const address = '0x' + Array.from({ length: 40 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');

  // Generate 12-word seed phrase (BIP39 word list subset)
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
 * Sign up a new user
 */
export async function signUp({ email, password, name }: SignUpData): Promise<{ success: boolean; error?: AuthError; userId?: string }> {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
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

    // 2. Generate wallet
    const wallet = generateUserWallet();

    // 3. Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        wallet_address: wallet.address,
        wallet_seed_phrase: wallet.seedPhrase, // TODO: Encrypt in production
        created_at: new Date().toISOString(),
        account_type: 'free',
        role: 'creator',
        email_verified: false,
        two_factor_enabled: false
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Auth user was created but profile failed - user can still log in
      // but won't have full profile
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
      // Sign out unverified user
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          code: 'email_not_verified'
        }
      };
    }

    // TEMPORARY FIX: Create profile from auth data to bypass database query
    // TODO: Fix RLS policies and database query
    const userName = authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User';

    const userProfile: UserProfile = {
      id: authData.user.id,
      email: authData.user.email!,
      name: userName,
      walletAddress: '0x' + authData.user.id.replace(/-/g, '').substring(0, 40),
      walletSeedPhrase: 'temporary seed phrase - please update in settings',
      createdAt: authData.user.created_at,
      accountType: 'free',
      role: 'creator',
      emailVerified: !!authData.user.email_confirmed_at,
      twoFactorEnabled: false
    };

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
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message
        }
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message
        }
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
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message
        }
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
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      walletAddress: profile.wallet_address,
      walletSeedPhrase: profile.wallet_seed_phrase,
      createdAt: profile.created_at,
      accountType: profile.account_type,
      role: profile.role,
      phone: profile.phone,
      bio: profile.bio,
      profilePhoto: profile.profile_photo,
      businessName: profile.business_name,
      businessWebsite: profile.business_website,
      industry: profile.industry,
      socialLinks: profile.social_links,
      emailVerified: profile.email_verified,
      twoFactorEnabled: profile.two_factor_enabled
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getCurrentUserProfile();
      callback(profile);
    } else {
      callback(null);
    }
  });
}

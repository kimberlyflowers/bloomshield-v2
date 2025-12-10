import { authClient } from './better-auth-client';
import { SignUpData, LoginData, UserProfile, AuthError } from '@/types/user';

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

export async function signUp({ email, password, name }: SignUpData): Promise<{ success: boolean; error?: AuthError; userId?: string }> {
  try {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name
    });

    if (error) return { success: false, error: { message: error.message || 'Sign up failed' } };
    return { success: true, userId: data?.user?.id };
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'An unexpected error occurred' } };
  }
}

export async function login({ email, password }: LoginData): Promise<{ success: boolean; error?: AuthError; user?: UserProfile }> {
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
    return { success: false, error: { message: error.message || 'An unexpected error occurred' } };
  }
}

export async function logout(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    await authClient.signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message || 'Logout failed' } };
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
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

export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  getCurrentUserProfile().then(callback);
  const interval = setInterval(async () => {
    const user = await getCurrentUserProfile();
    callback(user);
  }, 30000);

  return { unsubscribe: () => clearInterval(interval) };
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
  // TODO: Implement Better Auth password reset
  console.log('Password reset for:', email);
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    await authClient.changePassword({ newPassword, currentPassword: '', revokeOtherSessions: false });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function getSession() {
  try {
    const { data } = await authClient.getSession();
    return data?.session || null;
  } catch (error) {
    return null;
  }
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
  walletSeedPhrase: string; // Encrypted in production
  createdAt: string;
  accountType: 'free' | 'pro' | 'business';
  role: 'creator' | 'buyer' | 'both';
  phone?: string;
  bio?: string;
  profilePhoto?: string;
  businessName?: string;
  businessWebsite?: string;
  industry?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

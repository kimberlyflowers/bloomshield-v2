'use client';

import { useState } from 'react';
import { signUp, login, resetPassword } from '@/lib/auth';
import { SignUpData, LoginData, UserProfile } from '@/types/user';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onSignUpSuccess: (userId: string) => void;
}

type AuthView = 'login' | 'signup' | 'reset';

export default function AuthModal({ show, onClose, onLoginSuccess, onSignUpSuccess }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');

  if (!show) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!signupName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);

    try {
      const signUpData: SignUpData = {
        email: signupEmail,
        password: signupPassword,
        name: signupName
      };

      const result = await signUp(signUpData);

      if (!result.success) {
        setError(result.error?.message || 'Sign up failed');
        setLoading(false);
        return;
      }

      setSuccessMessage(`Verification email sent to ${signupEmail}\n\nPlease check your inbox and click the verification link to complete your registration. If you don't see the email, check your spam folder.`);

      // Reset form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupPasswordConfirm('');
      setAgreeToTerms(false);

      // Notify parent
      if (result.userId) {
        onSignUpSuccess(result.userId);
      }

      // Don't auto-switch - let user read the message and close manually
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const loginData: LoginData = {
        email: loginEmail,
        password: loginPassword,
        rememberMe
      };

      const result = await login(loginData);

      if (!result.success) {
        setError(result.error?.message || 'Login failed');
        setLoading(false);
        return;
      }

      if (result.user) {
        // Reset form
        setLoginEmail('');
        setLoginPassword('');
        setRememberMe(false);

        // Notify parent
        onLoginSuccess(result.user);
        onClose();
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(resetEmail);

      if (!result.success) {
        setError(result.error?.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccessMessage('Password reset email sent! Please check your inbox.');
      setResetEmail('');

      // Switch to login view after 3 seconds
      setTimeout(() => {
        setCurrentView('login');
        setSuccessMessage(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // If successful, user will be redirected to OAuth provider
    } catch (err: any) {
      setError(err.message || 'Failed to connect to ' + provider);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
            <p className="text-green-700 text-base whitespace-pre-line font-medium">{successMessage}</p>
          </div>
        )}

        {/* SIGN UP VIEW */}
        {currentView === 'signup' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-600 mb-6">Join BloomShield to protect your creative work</p>

            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <input
                  type="password"
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 mr-2 cursor-pointer accent-[#FF8C42]"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-[#FF8C42] hover:underline">
                      Terms of Service
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF8C42] text-white py-3 rounded-lg font-semibold hover:bg-[#ff7a2e] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">or continue with</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={loading}
                  className="flex-1 bg-[#1877F2] text-white py-3 rounded-lg font-semibold hover:bg-[#166FE5] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <p className="mt-4 text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setError(null);
                  }}
                  className="text-[#FF8C42] hover:underline"
                  disabled={loading}
                >
                  Log In
                </button>
              </p>
            </form>
          </div>
        )}

        {/* LOGIN VIEW */}
        {currentView === 'login' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-6">Log in to your BloomShield account</p>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6 flex justify-between items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 mr-2 cursor-pointer accent-[#FF8C42]"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('reset');
                    setError(null);
                  }}
                  className="text-sm text-[#FF8C42] hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF8C42] text-white py-3 rounded-lg font-semibold hover:bg-[#ff7a2e] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">or continue with</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={loading}
                  className="flex-1 bg-[#1877F2] text-white py-3 rounded-lg font-semibold hover:bg-[#166FE5] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <p className="mt-4 text-center text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('signup');
                    setError(null);
                  }}
                  className="text-[#FF8C42] hover:underline"
                  disabled={loading}
                >
                  Sign Up
                </button>
              </p>
            </form>
          </div>
        )}

        {/* RESET PASSWORD VIEW */}
        {currentView === 'reset' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h2>
            <p className="text-gray-600 mb-6">Enter your email and we'll send you a reset link</p>

            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C42]"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF8C42] text-white py-3 rounded-lg font-semibold hover:bg-[#ff7a2e] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setError(null);
                  }}
                  className="text-[#FF8C42] hover:underline text-sm"
                  disabled={loading}
                >
                  Back to Log In
                </button>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

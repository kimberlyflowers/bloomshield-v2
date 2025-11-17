'use client';

import { useState } from 'react';
import { signUp, login, resetPassword } from '@/lib/auth';
import { SignUpData, LoginData, UserProfile } from '@/types/user';

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

      setSuccessMessage('Account created! Please check your email to verify your account before logging in.');

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
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-green-700 text-sm">{successMessage}</p>
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

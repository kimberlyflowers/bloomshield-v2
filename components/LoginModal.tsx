'use client';

import { useState } from 'react';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  onLogin: (method: 'google' | 'email' | 'facebook') => void;
}

export default function LoginModal({ show, onClose, onLogin }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleLogin = async (method: 'google' | 'email' | 'facebook') => {
    setLoading(true);
    setError('');

    try {
      // Check if Supabase is configured
      if (typeof window !== 'undefined') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          // Environment not configured - show demo mode
          console.warn('Supabase not configured - using demo mode');
          setTimeout(() => {
            onLogin(method);
            onClose();
            setLoading(false);
          }, 1000);
          return;
        }

        // Real authentication with Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        let authResult;

        if (method === 'google') {
          authResult = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            }
          });
        } else if (method === 'facebook') {
          authResult = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: window.location.origin,
            }
          });
        } else {
          // Email login would show an email input form
          setError('Email login not yet implemented');
          setLoading(false);
          return;
        }

        if (authResult.error) {
          throw authResult.error;
        }

        onLogin(method);
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slideUp">
        {/* Header - Updated to match brand better */}
        <div className="relative bg-gradient-to-r from-pink-400 via-[#FF8C42] to-pink-300 p-8 rounded-t-2xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 text-6xl opacity-10">🌸</div>
          <div className="absolute bottom-0 left-0 text-4xl opacity-10">🛡️</div>

          <div className="relative flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🌸</span>
                <h2 className="text-2xl font-bold text-white">BloomShield</h2>
              </div>
              <p className="text-white/95 text-sm">Protect your creative work</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Login Options */}
        <div className="p-8 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={() => handleLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-[#FF8C42] hover:shadow-lg text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Email Login */}
          <button
            onClick={() => handleLogin('email')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-[#FF8C42] hover:shadow-lg text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Continue with Email
          </button>

          {/* Facebook Login */}
          <button
            onClick={() => handleLogin('facebook')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Secure authentication</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#FF8C42] border-t-transparent"></div>
              <p className="text-sm text-gray-600 mt-2">Connecting...</p>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By continuing, you agree to BloomShield's Terms of Service and Privacy Policy.
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <span className="block mt-2 text-orange-600 font-semibold">⚠️ Demo Mode - Configure .env.local for real auth</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

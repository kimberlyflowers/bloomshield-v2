'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bloom-canvas flex items-center justify-center p-4">
      <div className="bloom-panel w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-bloom-text mb-2">Reset Password</h1>
        <p className="text-bloom-muted mb-6">Enter your new password</p>

        {error && (
          <div className="mb-4 p-4 bg-red-950/60 border-l-4 border-red-500 rounded">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-emerald-200 font-semibold text-lg">Password reset successfully!</p>
            <p className="text-bloom-muted mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-bloom-text mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="bloom-input"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-bloom-text mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bloom-input"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bloom-primary py-3 rounded-lg font-semibold"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

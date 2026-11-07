'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { resetPassword } from '@/lib/auth';

type Factor = { id: string; status: string; factor_type: string };

export default function SecuritySettings({ email }: { email: string }) {
  const [factorId, setFactorId] = useState('');
  const [setup, setSetup] = useState<{ id: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabaseBrowserClient().auth.mfa.listFactors().then(({ data, error }: { data: { totp: Factor[] } | null; error: Error | null }) => {
      if (error) setMessage(error.message);
      else setFactorId(data?.totp.find(factor => factor.status === 'verified')?.id ?? '');
    });
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The change failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="workspace-card p-5">
        <h2 className="mb-2 font-semibold">Password</h2>
        <button disabled={busy || !email} className="workspace-action rounded-lg px-4 py-2"
          onClick={() => run(async () => {
            const result = await resetPassword(email);
            if (!result.success) throw new Error(result.error?.message || 'Could not send reset email.');
            setMessage('Check your inbox for a secure password change link.');
          })}>
          Email a password change link
        </button>
      </section>
      <section className="workspace-card space-y-3 p-5">
        <h2 className="font-semibold">Two-factor authentication</h2>
        {factorId ? (
          <button disabled={busy} className="workspace-action rounded-lg px-4 py-2"
            onClick={() => run(async () => {
              const { error } = await getSupabaseBrowserClient().auth.mfa.unenroll({ factorId });
              if (error) throw error;
              setFactorId('');
              setMessage('Authenticator removed.');
            })}>
            Remove authenticator
          </button>
        ) : setup ? (
          <form className="space-y-3" onSubmit={event => {
            event.preventDefault();
            void run(async () => {
              const { error } = await getSupabaseBrowserClient().auth.mfa.challengeAndVerify({ factorId: setup.id, code });
              if (error) throw error;
              setFactorId(setup.id);
              setSetup(null);
              setCode('');
              setMessage('Authenticator verified.');
            });
          }}>
            <p className="text-sm">Add a time-based entry in your authenticator app with this setup key.</p>
            <code className="block break-all">{setup.secret}</code>
            <label className="block text-sm" htmlFor="enrollment-code">Six-digit code</label>
            <input id="enrollment-code" className="rounded-lg border border-workspace-border p-2"
              value={code} onChange={event => setCode(event.target.value)} inputMode="numeric"
              autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
            <button disabled={busy} className="workspace-action block rounded-lg px-4 py-2">Verify and enable</button>
          </form>
        ) : (
          <button disabled={busy} className="workspace-action rounded-lg px-4 py-2"
            onClick={() => run(async () => {
              const auth = getSupabaseBrowserClient().auth;
              const existing = await auth.mfa.listFactors();
              if (existing.error) throw existing.error;
              for (const factor of existing.data.all.filter((item: Factor) => item.status === 'unverified' && item.factor_type === 'totp')) {
                const { error } = await auth.mfa.unenroll({ factorId: factor.id });
                if (error) throw error;
              }
              const { data, error } = await auth.mfa.enroll({ factorType: 'totp', issuer: 'BloomShield' });
              if (error) throw error;
              setSetup({ id: data.id, secret: data.totp.secret });
            })}>
            Set up authenticator
          </button>
        )}
      </section>
      {message && <p role="status" className="text-sm text-workspace-muted">{message}</p>}
    </div>
  );
}

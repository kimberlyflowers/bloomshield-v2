'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function VerifySignIn() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <main className="workspace min-h-screen grid place-items-center p-4">
      <form className="workspace-card w-full max-w-sm space-y-4 p-6" onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setMessage('');
        const auth = getSupabaseBrowserClient().auth;
        try {
          const { data, error } = await auth.mfa.listFactors();
          const factor = data?.totp.find((item: { id: string; status: string }) => item.status === 'verified');
          if (error || !factor) throw new Error('Authenticator setup could not be loaded.');
          const result = await auth.mfa.challengeAndVerify({ factorId: factor.id, code });
          if (result.error) throw result.error;
          window.location.replace('/');
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Verification failed.');
          setBusy(false);
        }
      }}>
        <h1 className="text-xl font-semibold">Verify your sign-in</h1>
        <label className="block text-sm" htmlFor="mfa-code">Code from your authenticator app</label>
        <input id="mfa-code" value={code} onChange={event => setCode(event.target.value)}
          className="w-full rounded-lg border border-workspace-border p-3" inputMode="numeric"
          autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
        {message && <p role="alert" className="text-sm text-red-300">{message}</p>}
        <button className="workspace-action min-h-11 w-full rounded-lg" disabled={busy}>Verify</button>
        <button type="button" onClick={async () => {
          await getSupabaseBrowserClient().auth.signOut();
          window.location.replace('/');
        }} className="text-sm text-workspace-muted">Sign out</button>
      </form>
    </main>
  );
}

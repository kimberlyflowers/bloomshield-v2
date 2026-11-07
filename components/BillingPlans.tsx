'use client';

import { useEffect, useState } from 'react';

const plans = [
  { key: 'free', name: 'Free', price: '$0', allowance: '3 digital assets per month' },
  { key: 'pro', name: 'Pro', price: '$19', allowance: '30 digital assets per month' },
  { key: 'unlimited', name: 'Unlimited', price: '$49', allowance: 'Unlimited digital assets' },
];

export default function BillingPlans() {
  const [status, setStatus] = useState<{ plan: string; limit: number | null; used: number; checkoutAvailable: boolean }>();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/billing/status', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Could not load your workspace plan.');
        return response.json();
      })
      .then(setStatus)
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);

  async function checkout(plan: string) {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not open checkout.');
      window.location.assign(result.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Checkout unavailable.');
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workspace billing</h1>
      {status && <p className="text-sm text-workspace-muted">
        {status.used}{status.limit === null ? '' : ` of ${status.limit}`} assets saved this month. Limits reset on the first day of each month (UTC).
      </p>}
      {error && <p role="alert">{error}</p>}
      <div className="grid gap-3 lg:grid-cols-3">
        {plans.map(plan => (
          <section className="workspace-card space-y-2 p-4" key={plan.key}>
            <h2 className="font-semibold">{plan.name}</h2>
            <p>{plan.price} / month</p>
            <p className="text-sm text-workspace-muted">{plan.allowance}</p>
            {status?.plan === plan.key ? <p className="text-sm text-workspace-accent">Current plan</p> :
              plan.key !== 'free' && (
                <button disabled={pending || !status?.checkoutAvailable || status.plan !== 'free'}
                  className="workspace-action min-h-11 rounded-lg px-4 text-sm disabled:opacity-50"
                  onClick={() => checkout(plan.key)}>
                  {status?.checkoutAvailable ? 'Continue to Whop' : 'Checkout unavailable'}
                </button>
              )}
          </section>
        ))}
      </div>
    </div>
  );
}

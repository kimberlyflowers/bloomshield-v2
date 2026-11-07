import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { whopConfigured, whopRequest, whopVariants } from '@/lib/whop';

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Sign in to choose a plan.' }, { status: 401 });
  if (!whopConfigured()) return NextResponse.json({ error: 'Paid checkout is unavailable.' }, { status: 503 });

  try {
    const { plan }: { plan?: unknown } = await request.json();
    if (plan !== 'pro' && plan !== 'unlimited') {
      return NextResponse.json({ error: 'Choose a paid plan.' }, { status: 400 });
    }
    const response = await whopRequest('/checkout_configurations', {
      method: 'POST',
      body: JSON.stringify({
        account_id: process.env.WHOP_ACCOUNT_ID,
        variant_id: whopVariants[plan],
        metadata: { bloomshield_tenant: user.id },
        redirect_url: 'https://bloomshield-v2.vercel.app/?billing=returned',
      }),
    });
    if (!response.ok) throw new Error(`Whop returned ${response.status}`);
    const url = new URL((await response.json()).purchase_url);
    const expected = process.env.WHOP_SANDBOX === 'true' ? 'sandbox.whop.com' : 'whop.com';
    if (url.protocol !== 'https:' || url.hostname !== expected) throw new Error('Unexpected checkout URL');
    return NextResponse.json({ url: url.href });
  } catch (error) {
    console.error('Whop checkout failed', error);
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 502 });
  }
}

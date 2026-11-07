import { createHmac, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { whopConfigured, whopRequest, whopVariants } from '@/lib/whop';

export async function POST(request: Request) {
  if (!whopConfigured()) return new Response('Billing unavailable', { status: 503 });
  const body = await request.text();
  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp') ?? '';
  const signatures = request.headers.get('webhook-signature') ?? '';
  if (!id || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return new Response('Invalid signature', { status: 401 });
  }
  const expected = createHmac('sha256', process.env.WHOP_WEBHOOK_SECRET!)
    .update(`${id}.${timestamp}.${body}`).digest();
  const valid = signatures.split(' ').some(signature => {
    if (!signature.startsWith('v1,')) return false;
    const bytes = Buffer.from(signature.slice(3), 'base64');
    return bytes.length === expected.length && timingSafeEqual(bytes, expected);
  });
  if (!valid) return new Response('Invalid signature', { status: 401 });

  try {
    const event = JSON.parse(body);
    if (event.type !== 'membership.updated' && event.type !== 'membership.activated') return new Response(null, { status: 204 });
    if (event.account_id !== process.env.WHOP_ACCOUNT_ID || !/^mem_[a-z0-9]+$/i.test(event.data?.id ?? '')) {
      return new Response(null, { status: 204 });
    }
    const response = await whopRequest(`/memberships/${event.data.id}`);
    if (!response.ok) throw new Error(`Whop membership lookup returned ${response.status}`);
    const membership = await response.json();
    const tenant = membership.metadata?.bloomshield_tenant;
    const variant = membership.variant_id;
    const plan = variant === whopVariants.unlimited ? 'unlimited' : variant === whopVariants.pro ? 'pro' : null;
    if (!plan || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(tenant ?? '')) {
      return new Response(null, { status: 204 });
    }
    const { error } = await createAdminClient().rpc('bloomshield_sync_membership', {
      membership_id: membership.id, tenant_id: tenant, plan_name: plan,
      membership_active: ['active', 'trialing'].includes(membership.status),
      changed_at: membership.updated_at,
    });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Whop membership sync failed', error);
    return new Response('Membership sync failed', { status: 503 });
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Sign in to delete your account.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }
  if (Date.now() - Date.parse(user.last_sign_in_at ?? '') > 15 * 60 * 1000 || !user.last_sign_in_at) {
    return NextResponse.json({ error: 'Sign out and sign in again before deleting your account.' }, { status: 403 });
  }
  const admin = createAdminClient();
  try {
    const memberships = await admin.from('bloomshield_memberships').select('id')
      .eq('tenant_id', user.id).eq('active', true).limit(1);
    if (memberships.error) throw memberships.error;
    if (memberships.data.length) {
      return NextResponse.json({ error: 'End your Whop membership before deleting this account.' }, { status: 409 });
    }

    const objects = await admin.rpc('bloomshield_account_objects', { tenant: user.id });
    if (objects.error) throw objects.error;
    for (let offset = 0; offset < objects.data.length; offset += 100) {
      const batch = objects.data.slice(offset, offset + 100).map((object: { name: string }) => object.name);
      const { error } = await admin.storage.from('protected-files').remove(batch);
      if (error) throw error;
    }
    const files = await admin.from('protected_files').delete().eq('user_id', user.id);
    if (files.error) throw files.error;
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Account deletion could not finish', error);
    return NextResponse.json({ error: 'Account deletion could not finish. You can retry this request.' }, { status: 503 });
  }
}

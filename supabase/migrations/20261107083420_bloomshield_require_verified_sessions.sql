create function public.bloomshield_session_allowed() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where id = (select auth.uid()))
  and (
    (select auth.jwt())->>'aal' = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors
      where user_id = (select auth.uid()) and status = 'verified'
    )
  );
$$;
revoke all on function public.bloomshield_session_allowed() from public, anon;
grant execute on function public.bloomshield_session_allowed() to authenticated;

create policy bloomshield_requires_verified_session on public.protected_files
as restrictive for all to authenticated
using ((select public.bloomshield_session_allowed()))
with check ((select public.bloomshield_session_allowed()));

create policy bloomshield_storage_requires_verified_session on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'protected-files' or (select public.bloomshield_session_allowed()))
with check (bucket_id <> 'protected-files' or (select public.bloomshield_session_allowed()));

create function public.bloomshield_account_objects(tenant uuid) returns table (name text)
language sql stable security definer set search_path = '' as $$
  select object.name from storage.objects object
  where object.bucket_id = 'protected-files' and object.owner_id = tenant::text;
$$;
revoke all on function public.bloomshield_account_objects(uuid) from public, anon, authenticated;
grant execute on function public.bloomshield_account_objects(uuid) to service_role;

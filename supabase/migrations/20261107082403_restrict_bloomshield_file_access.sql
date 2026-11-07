begin;
update storage.buckets set public = false where id = 'protected-files';
drop policy if exists "Allow public uploads bo9zfc_0" on storage.objects;
drop policy if exists "Allow public uploads bo9zfc_1" on storage.objects;
drop policy if exists "Allow public uploads bo9zfc_2" on storage.objects;
drop policy if exists "Allow public uploads bo9zfc_3" on storage.objects;
drop policy if exists "Users can upload own files" on storage.objects;
drop policy if exists "Users can read own files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete own files" on storage.objects;
create policy "BloomShield owners manage their files" on storage.objects
for all to authenticated
using (bucket_id = 'protected-files' and owner_id = (select auth.uid())::text)
with check (bucket_id = 'protected-files' and owner_id = (select auth.uid())::text);
drop policy if exists allow_public_select on public.protected_files;
drop policy if exists allow_public_insert on public.protected_files;
drop policy if exists allow_public_update on public.protected_files;
drop policy if exists allow_public_delete on public.protected_files;
alter table public.protected_files alter column user_id set default auth.uid();
commit;

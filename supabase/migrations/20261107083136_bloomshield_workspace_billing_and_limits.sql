create table public.bloomshield_memberships (
  id text primary key,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro', 'unlimited')),
  active boolean not null,
  updated_at timestamptz not null
);
alter table public.bloomshield_memberships enable row level security;
revoke all on public.bloomshield_memberships from anon, authenticated;

create table public.bloomshield_monthly_usage (
  tenant_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  assets integer not null default 0 check (assets >= 0),
  primary key (tenant_id, month)
);
alter table public.bloomshield_monthly_usage enable row level security;
revoke all on public.bloomshield_monthly_usage from anon, authenticated;

insert into public.bloomshield_monthly_usage (tenant_id, month, assets)
select f.user_id, date_trunc('month', f.created_at at time zone 'UTC')::date, count(*)
from public.protected_files f join auth.users u on u.id = f.user_id
group by 1, 2;

create function public.bloomshield_sync_membership(
  membership_id text, tenant_id uuid, plan_name text, membership_active boolean, changed_at timestamptz
) returns void language sql security invoker set search_path = '' as $$
  insert into public.bloomshield_memberships as membership (id, tenant_id, plan, active, updated_at)
  values ($1, $2, $3, $4, $5)
  on conflict (id) do update
    set plan = excluded.plan, active = excluded.active, updated_at = excluded.updated_at
    where membership.tenant_id = excluded.tenant_id and membership.updated_at <= excluded.updated_at;
$$;
revoke all on function public.bloomshield_sync_membership(text, uuid, text, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.bloomshield_sync_membership(text, uuid, text, boolean, timestamptz) to service_role;

create function public.bloomshield_plan() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('plan', case when active.unlimited then 'unlimited' when active.pro then 'pro' else 'free' end,
    'limit', case when active.unlimited then null when active.pro then 30 else 3 end,
    'used', coalesce(usage.assets, 0))
  from (
    select bool_or(plan = 'unlimited') as unlimited, bool_or(plan = 'pro') as pro
    from public.bloomshield_memberships
    where tenant_id = (select auth.uid()) and active
  ) active
  left join public.bloomshield_monthly_usage usage
    on usage.tenant_id = (select auth.uid())
    and usage.month = date_trunc('month', now() at time zone 'UTC')::date
  where (select auth.uid()) is not null;
$$;
revoke all on function public.bloomshield_plan() from public, anon;
grant execute on function public.bloomshield_plan() to authenticated;

create function public.bloomshield_meter_asset() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  monthly_limit integer;
  used_assets integer;
begin
  if (select auth.uid()) is null or new.user_id is distinct from (select auth.uid()) then
    raise exception 'An authenticated workspace owner is required' using errcode = '42501';
  end if;
  monthly_limit := (public.bloomshield_plan()->>'limit')::integer;
  insert into public.bloomshield_monthly_usage as usage (tenant_id, month, assets)
  values (new.user_id, date_trunc('month', now() at time zone 'UTC')::date, 1)
  on conflict (tenant_id, month) do update
    set assets = usage.assets + 1
    where monthly_limit is null or usage.assets < monthly_limit
  returning assets into used_assets;
  if used_assets is null then
    raise exception 'Monthly asset limit reached' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.bloomshield_meter_asset() from public, anon, authenticated;
create trigger bloomshield_meter_asset before insert on public.protected_files
for each row execute function public.bloomshield_meter_asset();

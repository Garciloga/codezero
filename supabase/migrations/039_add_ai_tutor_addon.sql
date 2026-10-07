-- Tutor IA add-on: separate entitlement from base plans.

create table if not exists public.account_addons (
  user_id uuid not null references public.profiles(id) on delete cascade,
  addon_key text not null,
  status text not null default 'inactive'
    check (status in ('inactive','active','past_due','canceled','incomplete','unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_schedule_id text,
  current_price_id text,
  cancel_at_period_end boolean not null default false,
  started_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, addon_key),
  constraint account_addons_key_check check (addon_key in ('ai_tutor'))
);

alter table public.account_addons enable row level security;

drop policy if exists "Users can read own addons" on public.account_addons;
create policy "Users can read own addons"
on public.account_addons for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "No client writes to addons" on public.account_addons;
create policy "No client writes to addons"
on public.account_addons for all
to anon, authenticated
using (false)
with check (false);

revoke insert, update, delete, truncate, references, trigger on table public.account_addons from anon, authenticated;
grant select on table public.account_addons to authenticated;
grant select, insert, update, delete on table public.account_addons to service_role;

create index if not exists account_addons_subscription_idx
  on public.account_addons(stripe_subscription_id);

update public.plans
set ai_query_limit = 0
where ai_query_limit <> 0;

create or replace view public.account_entitlements
with (security_invoker = true)
as
select
  p.id as user_id,
  p.plan_name,
  coalesce(pl.exercise_limit, 20) as exercise_limit,
  coalesce(pl.exam_limit, 1) as exam_limit,
  case
    when exists (
      select 1
      from public.account_addons aa
      where aa.user_id = p.id
        and aa.addon_key = 'ai_tutor'
        and aa.status = 'active'
    ) then 100
    else 0
  end as ai_query_limit,
  coalesce(pl.project_limit, 1) as project_limit,
  jsonb_build_object(
    'exercises', coalesce(u.exercises, 0),
    'exams', coalesce(u.exams, 0),
    'ai_queries', coalesce(u.ai_queries, 0),
    'projects', coalesce(u.projects, 0)
  ) as usage
from public.profiles p
left join public.plans pl on pl.name = p.plan_name
left join public.usage_monthly u
  on u.user_id = p.id
 and u.period_start = date_trunc('month', now())::date;

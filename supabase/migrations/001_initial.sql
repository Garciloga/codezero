create extension if not exists pgcrypto;

create type public.user_role as enum ('user','admin','owner');
create type public.account_status as enum ('active','suspended','cancelled');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  price_monthly_cents integer not null default 0,
  exercise_limit integer not null,
  exam_limit integer not null,
  ai_query_limit integer not null,
  project_limit integer not null,
  sort_order integer not null default 0,
  stripe_price_id text,
  active boolean not null default true
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'user',
  status public.account_status not null default 'active',
  plan_name text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_monthly (
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  exercises integer not null default 0,
  exams integer not null default 0,
  ai_queries integer not null default 0,
  projects integer not null default 0,
  primary key (user_id, period_start)
);

create table public.progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  level integer not null,
  mastery numeric(5,2) not null default 0,
  xp integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(user_id, level)
);

create index profiles_plan_idx on public.profiles(plan_name);
create index profiles_status_idx on public.profiles(status);
create index usage_period_idx on public.usage_monthly(period_start);

insert into public.plans(name,price_monthly_cents,exercise_limit,exam_limit,ai_query_limit,project_limit,sort_order)
values
 ('free',0,20,1,0,1,1),
 ('starter',19900,200,10,20,5,2),
 ('pro',49900,1000,50,100,20,3),
 ('enterprise',89900,-1,-1,-1,-1,4)
on conflict(name) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email) values(new.id,new.email);
  insert into public.usage_monthly(user_id,period_start)
  values(new.id,date_trunc('month',now())::date);
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace view public.account_entitlements as
select
 p.id as user_id,
 p.plan_name,
 coalesce(pl.exercise_limit,20) as exercise_limit,
 coalesce(pl.exam_limit,1) as exam_limit,
 coalesce(pl.ai_query_limit,0) as ai_query_limit,
 coalesce(pl.project_limit,1) as project_limit,
 jsonb_build_object(
   'exercises',coalesce(u.exercises,0),
   'exams',coalesce(u.exams,0),
   'ai_queries',coalesce(u.ai_queries,0),
   'projects',coalesce(u.projects,0)
 ) as usage
from public.profiles p
left join public.plans pl on pl.name=p.plan_name
left join public.usage_monthly u on u.user_id=p.id and u.period_start=date_trunc('month',now())::date;

alter view public.account_entitlements set (security_invoker = true);

create or replace function public.consume_quota(
  p_user_id uuid,
  p_metric text,
  p_amount integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  current_used integer;
  max_allowed integer;
  new_used integer;
  col text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  select case p_metric
    when 'exercises' then exercise_limit
    when 'exams' then exam_limit
    when 'ai_queries' then ai_query_limit
    when 'projects' then project_limit
    else null end
  into max_allowed
  from public.account_entitlements
  where user_id=p_user_id;

  if max_allowed is null then raise exception 'invalid metric'; end if;

  insert into public.usage_monthly(user_id,period_start)
  values(p_user_id,date_trunc('month',now())::date)
  on conflict do nothing;

  execute format('select %I from public.usage_monthly where user_id=$1 and period_start=date_trunc(''month'',now())::date for update', p_metric)
  into current_used using p_user_id;

  if max_allowed >= 0 and current_used + p_amount > max_allowed then
    return jsonb_build_object('allowed',false,'used',current_used,'limit',max_allowed,'remaining',greatest(0,max_allowed-current_used));
  end if;

  execute format('update public.usage_monthly set %I=%I+$1 where user_id=$2 and period_start=date_trunc(''month'',now())::date', p_metric, p_metric)
  using p_amount,p_user_id;

  new_used := current_used+p_amount;
  return jsonb_build_object('allowed',true,'used',new_used,'limit',max_allowed,'remaining',case when max_allowed<0 then -1 else max_allowed-new_used end);
end; $$;

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.usage_monthly enable row level security;
alter table public.progress enable row level security;

create policy "plans are readable" on public.plans for select to authenticated using (active=true);
create policy "users read own profile" on public.profiles for select to authenticated using (id=auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "users read own usage" on public.usage_monthly for select to authenticated using (user_id=auth.uid());
create policy "users read own progress" on public.progress for select to authenticated using (user_id=auth.uid());
create policy "users write own progress" on public.progress for insert to authenticated with check (user_id=auth.uid());
create policy "users update own progress" on public.progress for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

revoke all on public.plans from anon;
revoke all on public.profiles from anon;
revoke all on public.usage_monthly from anon;
revoke all on public.progress from anon;
grant select on public.plans to authenticated;
grant select,update on public.profiles to authenticated;
grant select on public.usage_monthly to authenticated;
grant select,insert,update on public.progress to authenticated;

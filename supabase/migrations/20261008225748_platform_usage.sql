-- First-party daily aggregates. No raw clicks, URLs, text or external trackers.
create table public.platform_usage_start (
  singleton boolean primary key default true check(singleton),
  started_at timestamptz not null default now()
);
insert into public.platform_usage_start(singleton) values(true);
alter table public.platform_usage_start enable row level security;
revoke all on public.platform_usage_start from public,anon,authenticated;
grant select on public.platform_usage_start to service_role;

create table public.platform_usage_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  section text not null check(section in ('dashboard','learning','training','career','reinforcements','competencies','certificates','community','mentoring','employment','practice','teams','profile','support','news','notifications','portfolio','modules','billing','administration')),
  clicks integer not null default 0 check(clicks between 0 and 20000),
  visits integer not null default 0 check(visits between 0 and 20000),
  last_seen timestamptz not null default now(),
  primary key(user_id,day,section)
);
create index platform_usage_day_idx on public.platform_usage_daily(day,user_id);
alter table public.platform_usage_daily enable row level security;
revoke all on public.platform_usage_daily from public,anon,authenticated;
grant select on public.platform_usage_daily to authenticated;
grant select,insert,update,delete on public.platform_usage_daily to service_role;
create policy platform_usage_own_export on public.platform_usage_daily for select to authenticated using(user_id=(select auth.uid()));

create table public.platform_usage_receipts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  batch_id uuid not null,
  received_at timestamptz not null default now(),
  primary key(user_id,batch_id)
);
create index platform_usage_receipts_date_idx on public.platform_usage_receipts(received_at);
alter table public.platform_usage_receipts enable row level security;
revoke all on public.platform_usage_receipts from public,anon,authenticated;
grant select,insert,delete on public.platform_usage_receipts to service_role;

create function public.record_platform_usage(p_user uuid,p_batch uuid,p_section text,p_clicks integer,p_visits integer)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_user is null or p_batch is null or p_section is null or p_clicks is null or p_visits is null
    or p_section not in ('dashboard','learning','training','career','reinforcements','competencies','certificates','community','mentoring','employment','practice','teams','profile','support','news','notifications','portfolio','modules','billing','administration')
    or p_clicks not between 0 and 200 or p_visits not between 0 and 1 or p_clicks+p_visits=0 then
    raise exception 'INVALID_USAGE';
  end if;
  if not exists(select 1 from public.profiles where id=p_user and status='active' and deleted_at is null and role<>'owner') then return;end if;
  insert into public.platform_usage_receipts(user_id,batch_id) values(p_user,p_batch) on conflict do nothing;
  if not found then return;end if;
  insert into public.platform_usage_daily(user_id,day,section,clicks,visits,last_seen)
  values(p_user,(now() at time zone 'America/Mexico_City')::date,p_section,p_clicks,p_visits,now())
  on conflict(user_id,day,section) do update set clicks=least(20000,public.platform_usage_daily.clicks+excluded.clicks),visits=least(20000,public.platform_usage_daily.visits+excluded.visits),last_seen=excluded.last_seen;
end $$;
revoke all on function public.record_platform_usage(uuid,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.record_platform_usage(uuid,uuid,text,integer,integer) to service_role;

create function public.platform_usage_report(p_actor uuid,p_days integer default 30,p_order text default 'least',p_search text default '',p_page integer default 1)
returns table(user_id uuid,email text,full_name text,clicks bigint,visits bigint,active_days bigint,last_seen timestamptz,total_users bigint)
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id=p_actor and role='owner' and status='active' and deleted_at is null) then raise exception 'FORBIDDEN';end if;
  if p_days is null or p_days not in (7,30,90) or p_order is null or p_order not in ('least','most','recent') or p_search is null or length(p_search)>100 or p_page is null or p_page not between 1 and 10000 then raise exception 'INVALID_REPORT';end if;
  return query
  with usage as (
    select d.user_id,sum(d.clicks) clicks,sum(d.visits) visits,count(distinct d.day) active_days,max(d.last_seen) last_seen
    from public.platform_usage_daily d where d.day >= (now() at time zone 'America/Mexico_City')::date-(p_days-1) group by d.user_id
  ),people as (
    select p.id,p.email::text,p.full_name::text,coalesce(u.clicks,0)::bigint clicks,coalesce(u.visits,0)::bigint visits,coalesce(u.active_days,0)::bigint active_days,u.last_seen
    from public.profiles p left join usage u on u.user_id=p.id
    where p.deleted_at is null and p.status='active' and p.role<>'owner'
    and (p_search='' or strpos(lower(coalesce(p.email,'')),lower(p_search))>0 or strpos(lower(coalesce(p.full_name,'')),lower(p_search))>0)
  )
  select p.id,p.email,p.full_name,p.clicks,p.visits,p.active_days,p.last_seen,count(*) over()
  from people p order by case when p_order='most' then p.clicks end desc nulls last,
    case when p_order='least' then p.clicks end asc nulls last,
    case when p_order='recent' then p.last_seen end desc nulls last,p.active_days,p.email,p.id
  limit 50 offset (p_page-1)*50;
end $$;
revoke all on function public.platform_usage_report(uuid,integer,text,text,integer) from public,anon,authenticated;
grant execute on function public.platform_usage_report(uuid,integer,text,text,integer) to service_role;

-- Daily buckets may cover partial days; remove data as soon as last_seen is 90 days old.
select cron.schedule('garciloga-platform-usage-retention','23 * * * *',$$delete from public.platform_usage_daily where last_seen<=now()-interval '90 days';delete from public.platform_usage_receipts where received_at<=now()-interval '2 days';$$);

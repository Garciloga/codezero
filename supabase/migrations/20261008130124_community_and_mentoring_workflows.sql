-- Backend-only workflows. No company identity, email or profile directory is exposed.
create table public.community_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 alias text not null check(char_length(alias) between 3 and 40 and alias !~ '[@<>]'),
 consent_version text not null check(consent_version='2026-10-08'),
 joined_at timestamptz not null default now(),
 blocked boolean not null default false
);
create unique index community_alias_unique on public.community_members(lower(alias));
create table public.community_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.community_members(user_id) on delete cascade,
 parent_id uuid references public.community_posts(id) on delete cascade,
 request_id uuid not null,
 category text not null check(category in ('help','progress','discussion')),
 title text not null check(char_length(title) between 1 and 120),
 body text not null check(char_length(body) between 1 and 4000),
 status text not null default 'pending' check(status in ('pending','approved','hidden')),
 locked boolean not null default false,
 created_at timestamptz not null default now(),
 unique(author_id,request_id)
);
create index community_feed_idx on public.community_posts(created_at desc,id) where parent_id is null and status='approved';
create index community_replies_idx on public.community_posts(parent_id,created_at);
create index community_author_idx on public.community_posts(author_id,created_at);
create index community_moderation_idx on public.community_posts(status,created_at);
create table public.community_reports (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.community_posts(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(char_length(reason) between 5 and 1000),
 resolved_at timestamptz,
 created_at timestamptz not null default now(),unique(post_id,reporter_id)
);
create index community_reporter_idx on public.community_reports(reporter_id);
create index community_open_reports_idx on public.community_reports(created_at) where resolved_at is null;
create table public.mentoring_profiles (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 3 and 60 and display_name !~ '[@<>]'),
 bio text not null check(char_length(bio) between 20 and 1500),
 languages text[] not null check(cardinality(languages) between 1 and 4 and languages <@ array['es','en','pt','fr']),
 status text not null default 'pending' check(status in ('pending','approved','paused')),
 consent_version text not null check(consent_version='2026-10-08'),
 created_at timestamptz not null default now()
);
create table public.mentoring_slots (
 id uuid primary key default gen_random_uuid(),mentor_id uuid not null references public.mentoring_profiles(user_id) on delete cascade,
 starts_at timestamptz not null,ends_at timestamptz not null,
 active boolean not null default true,check(ends_at=starts_at+interval '45 minutes'),
 unique(mentor_id,starts_at)
);
create index mentoring_available_idx on public.mentoring_slots(starts_at,mentor_id) where active;
create table public.mentoring_requests (
 id uuid primary key default gen_random_uuid(),
 slot_id uuid not null references public.mentoring_slots(id),
 learner_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,topic text not null check(char_length(topic) between 10 and 1500),
 status text not null default 'pending' check(status in ('pending','confirmed','cancelled','declined','expired','completed')),
 price_cents integer not null default 69900 check(price_cents=69900),currency text not null default 'mxn' check(currency='mxn'),
 expires_at timestamptz not null,payment_reference text,meeting_url text,
 created_at timestamptz not null default now(),unique(learner_id,request_id)
);
create unique index mentoring_one_reservation on public.mentoring_requests(slot_id) where status in ('pending','confirmed');
create index mentoring_learner_idx on public.mentoring_requests(learner_id,created_at);
create index mentoring_slot_idx on public.mentoring_requests(slot_id);
create index mentoring_expiry_idx on public.mentoring_requests(expires_at) where status='pending';
create table public.social_workflow_audit (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,target_id uuid,created_at timestamptz not null default now()
);
create index social_audit_actor_idx on public.social_workflow_audit(actor_id);
do $$declare t text;begin
 foreach t in array array['community_members','community_posts','community_reports','mentoring_profiles','mentoring_slots','mentoring_requests','social_workflow_audit'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end$$;
revoke all on sequence public.social_workflow_audit_id_seq from public,anon,authenticated;
grant usage,select on sequence public.social_workflow_audit_id_seq to service_role;

create function public.social_actor_allowed(p_actor uuid,p_moderator boolean default false)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.users u on u.id=p.id
 where p.id=p_actor and p.status::text='active' and u.email_confirmed_at is not null
 and (not p_moderator or p.role::text in ('owner','admin')))
$$;

create function public.community_action(p_actor uuid,p_action text,p_target uuid default null,p_request uuid default null,
 p_parent uuid default null,p_title text default '',p_body text default '',p_alias text default '',p_category text default 'help',p_consent boolean default false)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_post public.community_posts;v_parent public.community_posts;v_id uuid;v_mod boolean;
begin
 if not public.social_actor_allowed(p_actor) then raise exception 'FORBIDDEN';end if;
 v_mod:=public.social_actor_allowed(p_actor,true);
 perform pg_advisory_xact_lock(hashtextextended('community:'||p_actor::text,0));
 if p_action='join' then
  if not p_consent or exists(select 1 from public.profiles where id=p_actor and role::text='owner') then raise exception 'CONSENT_REQUIRED';end if;
  insert into public.community_members(user_id,alias,consent_version) values(p_actor,btrim(p_alias),'2026-10-08')
   on conflict(user_id) do update set alias=excluded.alias where not community_members.blocked;
  if not found then raise exception 'FORBIDDEN';end if;return p_actor;
 end if;
 if p_action='leave' then
  -- A moderation suspension remains effective even after withdrawing public content.
  if exists(select 1 from public.community_members where user_id=p_actor and blocked) then
   delete from public.community_posts where author_id=p_actor;
   update public.community_members set alias='Retirada-'||right(p_actor::text,24) where user_id=p_actor;
  else delete from public.community_members where user_id=p_actor;end if;
  delete from public.community_reports where reporter_id=p_actor;return p_actor;
 end if;
 if not v_mod and not exists(select 1 from public.community_members where user_id=p_actor and not blocked) then raise exception 'FORBIDDEN';end if;
 if p_action='unblock' then
  if not v_mod then raise exception 'FORBIDDEN';end if;
  update public.community_members set blocked=false where user_id=p_target;
  insert into public.social_workflow_audit(actor_id,action,target_id) values(p_actor,'community_unblock',p_target);return p_target;
 end if;
 if p_action='post' then
  if not exists(select 1 from public.community_members where user_id=p_actor and not blocked) then raise exception 'FORBIDDEN';end if;
  select id into v_id from public.community_posts where author_id=p_actor and request_id=p_request;
  if v_id is not null then return v_id;end if;
  if p_request is null then raise exception 'INVALID_REQUEST';end if;
  if (select count(*) from public.community_posts where author_id=p_actor and created_at>now()-interval '1 hour')>=10 then raise exception 'RATE_LIMIT';end if;
  if p_parent is not null then
   select * into v_parent from public.community_posts where id=p_parent for update;
   if not found or v_parent.parent_id is not null or v_parent.status<>'approved' or v_parent.locked then raise exception 'THREAD_UNAVAILABLE';end if;
   if not exists(select 1 from public.community_members m join public.profiles p on p.id=m.user_id where m.user_id=v_parent.author_id and not m.blocked and p.status::text='active') then raise exception 'THREAD_UNAVAILABLE';end if;
  end if;
  insert into public.community_posts(author_id,parent_id,request_id,category,title,body)
   values(p_actor,p_parent,p_request,case when p_parent is null then p_category else v_parent.category end,
    case when p_parent is null then btrim(p_title) else v_parent.title end,btrim(p_body)) returning id into v_id;
  return v_id;
 end if;
 select * into v_post from public.community_posts where id=p_target for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if p_action='remove' and (v_post.author_id=p_actor or v_mod) then
  delete from public.community_posts where id=p_target;
 elsif p_action='report' and v_post.status='approved' then
  insert into public.community_reports(post_id,reporter_id,reason) values(p_target,p_actor,btrim(p_body)) on conflict(post_id,reporter_id) do nothing;
 elsif v_mod and p_action in ('approve','hide','lock','block','resolve') then
  if p_action in ('approve','hide') then update public.community_posts set status=case when p_action='approve' then 'approved' else 'hidden' end where id=p_target;
  elsif p_action='lock' then update public.community_posts set locked=not locked where id=p_target;
  elsif p_action='block' then update public.community_members set blocked=true where user_id=v_post.author_id;end if;
  if p_action in ('hide','resolve','block') then update public.community_reports set resolved_at=now() where post_id=p_target and resolved_at is null;end if;
 else raise exception 'FORBIDDEN';end if;
 insert into public.social_workflow_audit(actor_id,action,target_id) values(p_actor,'community_'||p_action,p_target);
 return p_target;
end$$;

create function public.community_feed(p_actor uuid,p_parent uuid default null,p_before timestamptz default null,p_cursor uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_mod boolean;v_result jsonb;
begin
 if not public.social_actor_allowed(p_actor) then raise exception 'FORBIDDEN';end if;
 v_mod:=public.social_actor_allowed(p_actor,true);
 if not v_mod and not exists(select 1 from public.community_members where user_id=p_actor and not blocked) then raise exception 'FORBIDDEN';end if;
 if p_parent is not null and not exists(select 1 from public.community_posts p join public.community_members m on m.user_id=p.author_id
 join public.profiles a on a.id=m.user_id where p.id=p_parent and p.parent_id is null and p.status='approved' and not m.blocked and a.status::text='active') then raise exception 'THREAD_UNAVAILABLE';end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by (r.id=p_parent) desc nulls last,r.created_at desc,r.id),'[]'::jsonb) into v_result from (
 select p.id,p.parent_id,p.title,p.body,p.category,p.status,p.locked,p.created_at,m.alias,p.author_id=p_actor as own
 from public.community_posts p join public.community_members m on m.user_id=p.author_id join public.profiles a on a.id=m.user_id
 where not m.blocked and a.status::text='active' and (p.status='approved' or p.author_id=p_actor or v_mod)
 and (case when p_parent is null then p.parent_id is null else p.parent_id=p_parent or p.id=p_parent end)
 and (p.id=p_parent or p_before is null or p.created_at<p_before or p.created_at=p_before and p_cursor is not null and p.id>p_cursor) order by (p.id=p_parent) desc nulls last,p.created_at desc,p.id limit 31) r;
 return v_result;
end$$;

create function public.mentoring_action(p_actor uuid,p_action text,p_target uuid default null,p_request uuid default null,
 p_name text default '',p_bio text default '',p_languages text[] default array['es'],p_start timestamptz default null,
 p_topic text default '',p_reference text default '',p_url text default '',p_consent boolean default false)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_mod boolean;v_slot public.mentoring_slots;v_request public.mentoring_requests;v_id uuid;v_mentor uuid;
begin
 if not public.social_actor_allowed(p_actor) then raise exception 'FORBIDDEN';end if;
 v_mod:=public.social_actor_allowed(p_actor,true);
 perform pg_advisory_xact_lock(hashtextextended('mentoring:actor:'||p_actor::text,0));
 if p_action='apply' then
  if not p_consent or exists(select 1 from public.profiles where id=p_actor and role::text='owner') then raise exception 'CONSENT_REQUIRED';end if;
  insert into public.mentoring_profiles(user_id,display_name,bio,languages,consent_version) values(p_actor,btrim(p_name),btrim(p_bio),p_languages,'2026-10-08')
   on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,languages=excluded.languages,status='pending';
  return p_actor;
 end if;
 if p_action in ('approve_mentor','pause_mentor') then
  if not v_mod then raise exception 'FORBIDDEN';end if;
  update public.mentoring_profiles set status=case when p_action='approve_mentor' then 'approved' else 'paused' end where user_id=p_target;
  if not found then raise exception 'NOT_FOUND';end if;v_id:=p_target;
 elsif p_action='slot' then
  perform 1 from public.mentoring_profiles where user_id=p_actor and status='approved' for update;
  if not found or p_start is null or p_start<now()+interval '24 hours' or p_start>now()+interval '90 days' then raise exception 'INVALID_SLOT';end if;
  select id into v_id from public.mentoring_slots where mentor_id=p_actor and starts_at=p_start and active;
  if v_id is not null then return v_id;end if;
  if exists(select 1 from public.mentoring_slots where mentor_id=p_actor and active and starts_at<p_start+interval '45 minutes' and ends_at>p_start) then raise exception 'OVERLAP';end if;
  if (select count(*) from public.mentoring_slots where mentor_id=p_actor and active and starts_at>now())>=100 then raise exception 'RATE_LIMIT';end if;
  insert into public.mentoring_slots(mentor_id,starts_at,ends_at) values(p_actor,p_start,p_start+interval '45 minutes')
   on conflict(mentor_id,starts_at) do update set active=true returning id into v_id;
 elsif p_action in ('request','close_slot') then
  select * into v_slot from public.mentoring_slots where id=p_target for update;
  if not found then raise exception 'NOT_FOUND';end if;
  update public.mentoring_requests set status='expired' where slot_id=p_target and status='pending' and expires_at<=now();
  if p_action='close_slot' then
   if v_slot.mentor_id<>p_actor and not v_mod then raise exception 'FORBIDDEN';end if;
   if exists(select 1 from public.mentoring_requests where slot_id=p_target and status='confirmed') then raise exception 'CONFIRMED_SESSION';end if;
   update public.mentoring_slots set active=false where id=p_target;
   update public.mentoring_requests set status='declined' where slot_id=p_target and status='pending';v_id:=p_target;
  else
   select id into v_id from public.mentoring_requests where learner_id=p_actor and request_id=p_request;
   if v_id is not null then return v_id;end if;
   if p_request is null or not v_slot.active or v_slot.mentor_id=p_actor or v_slot.starts_at<=now()+interval '24 hours' then raise exception 'INVALID_REQUEST';end if;
   perform 1 from public.mentoring_profiles m join public.profiles p on p.id=m.user_id where m.user_id=v_slot.mentor_id and m.status='approved' and p.status::text='active' for share of m;
   if not found then raise exception 'MENTOR_UNAVAILABLE';end if;
   if (select count(*) from public.mentoring_requests r join public.mentoring_slots s on s.id=r.slot_id where r.learner_id=p_actor and s.ends_at>now() and (r.status='confirmed' or r.status='pending' and r.expires_at>now()))>=3 then raise exception 'RATE_LIMIT';end if;
   if exists(select 1 from public.mentoring_requests r join public.mentoring_slots s on s.id=r.slot_id where r.learner_id=p_actor and (r.status='confirmed' or r.status='pending' and r.expires_at>now()) and s.starts_at<v_slot.ends_at and s.ends_at>v_slot.starts_at) then raise exception 'OVERLAP';end if;
   insert into public.mentoring_requests(slot_id,learner_id,request_id,topic,expires_at) values(p_target,p_actor,p_request,btrim(p_topic),least(now()+interval '24 hours',v_slot.starts_at-interval '1 hour')) returning id into v_id;
  end if;
 else
  select slot_id into v_id from public.mentoring_requests where id=p_target;
  select * into v_slot from public.mentoring_slots where id=v_id for update;
  select * into v_request from public.mentoring_requests where id=p_target for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if p_action='cancel' and (v_request.learner_id=p_actor or v_mod or v_slot.mentor_id=p_actor) then
   if v_request.status not in ('pending','confirmed') then raise exception 'INVALID_STATE';end if;
   update public.mentoring_requests set status='cancelled' where id=p_target;
  elsif p_action='decline' and (v_mod or v_slot.mentor_id=p_actor) then
   if v_request.status<>'pending' then raise exception 'INVALID_STATE';end if;
   update public.mentoring_requests set status='declined' where id=p_target;
  elsif p_action='confirm' and v_mod then
   -- No Stripe changes or charges: only an operator can record an externally verified payment.
   if v_request.status<>'pending' or v_request.expires_at<=now() or v_slot.starts_at<=now() or not v_slot.active
    or char_length(btrim(p_reference)) not between 5 and 200 or char_length(p_url)>500 or p_url !~ '^https://[^/@[:space:]]+([/?#]|$)' then raise exception 'INVALID_CONFIRMATION';end if;
   if not exists(select 1 from public.mentoring_profiles m join public.profiles p on p.id=m.user_id where m.user_id=v_slot.mentor_id and m.status='approved' and p.status::text='active') then raise exception 'MENTOR_UNAVAILABLE';end if;
   update public.mentoring_requests set status='confirmed',payment_reference=btrim(p_reference),meeting_url=p_url where id=p_target;
  elsif p_action='complete' and (v_mod or v_slot.mentor_id=p_actor) then
   if v_request.status<>'confirmed' or v_slot.ends_at>now() then raise exception 'INVALID_STATE';end if;
   update public.mentoring_requests set status='completed' where id=p_target;
  else raise exception 'FORBIDDEN';end if;v_id:=p_target;
 end if;
 insert into public.social_workflow_audit(actor_id,action,target_id) values(p_actor,'mentoring_'||p_action,v_id);return v_id;
end$$;

do $$declare f regprocedure;begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('social_actor_allowed','community_action','community_feed','mentoring_action') loop
 execute format('revoke all on function %s from public,anon,authenticated',f);
 execute format('grant execute on function %s to service_role',f);
 end loop;
end$$;

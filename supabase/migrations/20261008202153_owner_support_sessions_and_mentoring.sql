create or replace function public.mentoring_action(p_actor uuid,p_action text,p_target uuid default null,p_request uuid default null,
 p_name text default '',p_bio text default '',p_languages text[] default array['es'],p_start timestamptz default null,
 p_topic text default '',p_reference text default '',p_url text default '',p_consent boolean default false)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_mod boolean;v_slot public.mentoring_slots;v_request public.mentoring_requests;v_id uuid;v_mentor uuid;
begin
 if not public.social_actor_allowed(p_actor) then raise exception 'FORBIDDEN';end if;
 v_mod:=exists(select 1 from public.profiles where id=p_actor and role::text='owner' and status::text='active');
 if p_action in ('apply','approve_mentor','pause_mentor') then raise exception 'OWNER_MENTORING_ONLY';end if;
 if p_action in ('owner_profile','slot','close_slot','confirm','decline','complete') and not v_mod then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended('mentoring:actor:'||p_actor::text,0));
 if p_action='owner_profile' then
  if not p_consent or not v_mod then raise exception 'CONSENT_REQUIRED';end if;
  insert into public.mentoring_profiles(user_id,display_name,bio,languages,consent_version,status) values(p_actor,btrim(p_name),btrim(p_bio),p_languages,'2026-10-08','approved')
   on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,languages=excluded.languages,status='approved';
  insert into public.social_workflow_audit(actor_id,action,target_id) values(p_actor,'mentoring_owner_profile',p_actor);
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
   perform 1 from public.mentoring_profiles m join public.profiles p on p.id=m.user_id where m.user_id=v_slot.mentor_id and m.status='approved' and p.status::text='active' and p.role::text='owner' for share of m;
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
   if not exists(select 1 from public.mentoring_profiles m join public.profiles p on p.id=m.user_id where m.user_id=v_slot.mentor_id and m.status='approved' and p.status::text='active' and p.role::text='owner') then raise exception 'MENTOR_UNAVAILABLE';end if;
   update public.mentoring_requests set status='confirmed',payment_reference=btrim(p_reference),meeting_url=p_url where id=p_target;
  elsif p_action='complete' and (v_mod or v_slot.mentor_id=p_actor) then
   if v_request.status<>'confirmed' or v_slot.ends_at>now() then raise exception 'INVALID_STATE';end if;
   update public.mentoring_requests set status='completed' where id=p_target;
  else raise exception 'FORBIDDEN';end if;v_id:=p_target;
 end if;
 insert into public.social_workflow_audit(actor_id,action,target_id) values(p_actor,'mentoring_'||p_action,v_id);return v_id;
end$$;

-- Administrative deletion retains historical foreign keys and stops access atomically.
alter table public.profiles add column if not exists deleted_at timestamptz;
create schema if not exists account_security;
revoke all on schema account_security from public,anon;
grant usage on schema account_security to service_role,authenticated;
create or replace function account_security.archive_user(p_actor uuid,p_target uuid,p_email text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.profiles;
begin
 perform 1 from public.profiles where id=p_actor and role::text='owner' and status::text='active' and deleted_at is null for update;
 if not found or p_target=p_actor then raise exception 'FORBIDDEN';end if;
 select * into v from public.profiles where id=p_target for update;
 if not found or v.role::text='owner' or v.deleted_at is not null then raise exception 'INVALID_TARGET';end if;
 if lower(v.email)<>lower(btrim(p_email)) then raise exception 'EMAIL_MISMATCH';end if;
 if (v.stripe_subscription_id is not null and coalesce(v.billing_status,'') not in ('canceled','cancelled'))
 or exists(select 1 from public.account_addons where user_id=p_target and stripe_subscription_id is not null and status not in ('canceled','cancelled','inactive'))
 or exists(select 1 from public.company_seat_orders where requester_id=p_target and stripe_subscription_id is not null and status<>'inactive') then raise exception 'ACTIVE_BILLING';end if;
 if exists(select 1 from public.organization_memberships where user_id=p_target and active and role='owner') then raise exception 'COMPANY_OWNER';end if;
 update auth.users set banned_until=now()+interval '100 years',updated_at=now() where id=p_target;
 delete from auth.sessions where user_id=p_target;
 delete from auth.refresh_tokens where user_id=p_target::text;
 update public.organization_memberships set active=false where user_id=p_target;
 update public.profiles set deleted_at=now(),email='deleted+'||p_target::text||'@invalid.local',full_name='Usuario eliminado',status='cancelled',updated_at=now() where id=p_target;
 insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata)
 values(p_actor,'user_access_deleted','profile',p_target,jsonb_build_object('archived',true,'sessions_revoked',true));
end$$;
revoke all on function account_security.archive_user(uuid,uuid,text) from public,anon,authenticated;
grant execute on function account_security.archive_user(uuid,uuid,text) to service_role;
create or replace function public.owner_archive_user(p_actor uuid,p_target uuid,p_email text)
returns void language sql security invoker set search_path='' as $$select account_security.archive_user(p_actor,p_target,p_email)$$;
revoke all on function public.owner_archive_user(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.owner_archive_user(uuid,uuid,text) to service_role;
create table public.owner_support_sessions(
 session_id uuid primary key,owner_id uuid not null,target_id uuid not null,
 expires_at timestamptz not null,ended_at timestamptz,created_at timestamptz not null default now()
);
alter table public.owner_support_sessions enable row level security;
revoke all on public.owner_support_sessions from public,anon,authenticated;
grant all on public.owner_support_sessions to service_role;
-- Reject old JWTs at the database layer as well as the authenticated backend.
create schema if not exists account_security;
revoke all on schema account_security from public,anon;
grant usage on schema account_security to authenticated;
create or replace function account_security.account_not_archived()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and deleted_at is null)
 and not exists(select 1 from public.owner_support_sessions s where s.session_id=((select auth.jwt())->>'session_id')::uuid
 and (s.target_id<>(select auth.uid()) or s.ended_at is not null or s.expires_at<=now()))
$$;
revoke all on function account_security.account_not_archived() from public,anon;
grant execute on function account_security.account_not_archived() to authenticated;
create or replace function account_security.support_can_write()
returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.owner_support_sessions where session_id=((select auth.jwt())->>'session_id')::uuid)
$$;
revoke all on function account_security.support_can_write() from public,anon;
grant execute on function account_security.support_can_write() to authenticated;
do $$declare t record;begin
 for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity loop
 execute format('create policy account_not_archived on public.%I as restrictive for all to authenticated using ((select account_security.account_not_archived())) with check ((select account_security.account_not_archived()))',t.relname);
 execute format('create policy support_no_insert on public.%I as restrictive for insert to authenticated with check ((select account_security.support_can_write()))',t.relname);
 execute format('create policy support_no_update on public.%I as restrictive for update to authenticated using ((select account_security.support_can_write())) with check ((select account_security.support_can_write()))',t.relname);
 execute format('create policy support_no_delete on public.%I as restrictive for delete to authenticated using ((select account_security.support_can_write()))',t.relname);
 end loop;
end$$;
update public.mentoring_profiles m set status='paused' from public.profiles p where p.id=m.user_id and p.role::text<>'owner';
update public.mentoring_slots s set active=false from public.profiles p where p.id=s.mentor_id and p.role::text<>'owner';


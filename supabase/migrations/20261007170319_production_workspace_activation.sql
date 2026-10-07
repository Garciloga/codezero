-- Isaac authorized production activation on 2026-10-07.
-- Additive schema only; no synthetic data, Auth configuration or existing quotas changed.
begin;
create schema if not exists codezero_private;
revoke all on schema codezero_private from public, anon;
grant usage on schema codezero_private to authenticated, service_role;
create table public.user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 mode text not null check (mode in ('system','light','dark')),
 accent text not null check (accent in ('blue','green','purple','orange')),
 updated_at timestamptz not null default now()
);
create table public.issued_block_diplomas (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 level_number integer not null check(level_number between 1 and 15),
 learner_name text not null, block_title text not null, requirements jsonb not null,
 issued_at timestamptz not null default now(), unique(user_id,level_number)
);
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.organization_memberships (
 organization_id uuid references public.organizations(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 1 and 120),
 role text not null check(role in ('owner','admin','manager','supervisor','learner')),
 reports_to uuid, active boolean not null default true,
 primary key(organization_id,user_id),
 foreign key(organization_id,reports_to) references public.organization_memberships(organization_id,user_id),
 check(reports_to is null or reports_to<>user_id)
);
create index organization_memberships_reports_idx on public.organization_memberships(organization_id,reports_to);
create table codezero_private.organization_access (
 organization_id uuid not null, viewer_id uuid not null, target_id uuid not null,
 can_manage boolean not null, primary key(organization_id,viewer_id,target_id),
 foreign key(organization_id,viewer_id) references public.organization_memberships(organization_id,user_id) on delete cascade,
 foreign key(organization_id,target_id) references public.organization_memberships(organization_id,user_id) on delete cascade
);
create table public.organization_invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 email text not null check(email=lower(email)), role text not null check(role in ('admin','manager','supervisor','learner')),
 reports_to uuid, created_by uuid not null references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days',
 accepted_user_id uuid references auth.users(id), accepted_at timestamptz,
 foreign key(organization_id,reports_to) references public.organization_memberships(organization_id,user_id),
 check ((accepted_user_id is null)=(accepted_at is null))
);
create index organization_invitations_org_idx on public.organization_invitations(organization_id);
create table public.learning_assignments (
 organization_id uuid not null, user_id uuid not null, activity_key text not null,
 activity_type text not null check(activity_type in ('lesson','exam','project')), activity_id bigint not null check(activity_id>0),
 title text not null, competency text not null check(length(competency) between 1 and 80), created_at timestamptz not null default now(),
 primary key(organization_id,user_id,activity_key),
 foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id) on delete cascade,
 check(activity_key=activity_type||':'||activity_id::text)
);
create table public.learning_evidence (
 organization_id uuid not null, user_id uuid not null, activity_key text not null,
 completed boolean not null, score integer check(score between 0 and 100), observed_at timestamptz not null default now(),
 primary key(organization_id,user_id,activity_key),
 foreign key(organization_id,user_id,activity_key) references public.learning_assignments(organization_id,user_id,activity_key) on delete cascade
);
create table public.learning_errors (
 organization_id uuid not null, user_id uuid not null, activity_key text not null,
 event_key text not null, category text not null check(category in ('exam_not_passed','project_needs_revision')),
 occurred_at timestamptz not null, primary key(organization_id,user_id,event_key),
 foreign key(organization_id,user_id,activity_key) references public.learning_assignments(organization_id,user_id,activity_key) on delete cascade
);
create index learning_errors_date_idx on public.learning_errors(organization_id,user_id,occurred_at);
create table public.organization_audit_log (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 actor_id uuid not null references auth.users(id), target_id uuid references auth.users(id),
 action text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index organization_audit_org_idx on public.organization_audit_log(organization_id,created_at);

alter table codezero_private.organization_access enable row level security;
grant select on codezero_private.organization_access to authenticated;
grant all on codezero_private.organization_access to service_role;
create policy access_own on codezero_private.organization_access for select to authenticated using (
 viewer_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active')
);
alter table public.user_preferences enable row level security;
alter table public.issued_block_diplomas enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.learning_assignments enable row level security;
alter table public.learning_evidence enable row level security;
alter table public.learning_errors enable row level security;
alter table public.organization_audit_log enable row level security;
revoke all on public.user_preferences,public.issued_block_diplomas,public.organizations,public.organization_memberships,public.organization_invitations,public.learning_assignments,public.learning_evidence,public.learning_errors,public.organization_audit_log from public,anon,authenticated;
grant select,insert,update on public.user_preferences to authenticated;
grant select on public.issued_block_diplomas,public.organizations,public.organization_memberships,public.organization_invitations,public.learning_assignments,public.learning_evidence,public.learning_errors,public.organization_audit_log to authenticated;
grant all on public.user_preferences,public.issued_block_diplomas,public.organizations,public.organization_memberships,public.organization_invitations,public.learning_assignments,public.learning_evidence,public.learning_errors,public.organization_audit_log to service_role;
create policy preferences_read on public.user_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy preferences_insert on public.user_preferences for insert to authenticated with check(user_id=(select auth.uid()));
create policy preferences_update on public.user_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy diploma_read on public.issued_block_diplomas for select to authenticated using(user_id=(select auth.uid()));
create policy organization_read on public.organizations for select to authenticated using(active and exists(select 1 from codezero_private.organization_access a where a.organization_id=id and a.viewer_id=(select auth.uid())));
create policy membership_read on public.organization_memberships for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_memberships.organization_id and a.viewer_id=(select auth.uid()) and (a.can_manage or (active and a.target_id=user_id))));
create policy invitation_read on public.organization_invitations for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_invitations.organization_id and a.viewer_id=(select auth.uid()) and a.can_manage));
create policy assignment_read on public.learning_assignments for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_assignments.organization_id and a.target_id=user_id and a.viewer_id=(select auth.uid())));
create policy evidence_read on public.learning_evidence for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_evidence.organization_id and a.target_id=user_id and a.viewer_id=(select auth.uid())));
create policy error_read on public.learning_errors for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_errors.organization_id and a.target_id=user_id and a.viewer_id=(select auth.uid())));
create policy audit_read on public.organization_audit_log for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_audit_log.organization_id and a.viewer_id=(select auth.uid()) and a.can_manage));

create function public.rebuild_organization_access(p_org uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.organizations where id=p_org for update;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and role='owner' and active) then raise exception 'LAST_OWNER'; end if;
 if exists(select 1 from public.organization_memberships c join public.organization_memberships p on p.organization_id=c.organization_id and p.user_id=c.reports_to where c.organization_id=p_org and (p.role='learner' or (c.active and not p.active))) then raise exception 'INVALID_MANAGER'; end if;
 if exists(with recursive path as (
  select user_id,reports_to,array[user_id] ids,false cycle from public.organization_memberships where organization_id=p_org
  union all select t.user_id,m.reports_to,t.ids||m.user_id,m.user_id=any(t.ids) from path t join public.organization_memberships m on m.organization_id=p_org and m.user_id=t.reports_to where not t.cycle
 ) select 1 from path where cycle) then raise exception 'HIERARCHY_CYCLE'; end if;
 delete from codezero_private.organization_access where organization_id=p_org;
 insert into codezero_private.organization_access(organization_id,viewer_id,target_id,can_manage)
 with recursive ancestors as (
  select user_id target_id,user_id ancestor_id,reports_to,0 depth from public.organization_memberships where organization_id=p_org and active
  union all select a.target_id,m.user_id,m.reports_to,a.depth+1 from ancestors a join public.organization_memberships m on m.organization_id=p_org and m.user_id=a.reports_to and m.active
 )
 select distinct p_org,v.user_id,t.user_id,v.role in ('owner','admin')
 from public.organization_memberships v cross join public.organization_memberships t
 where v.organization_id=p_org and t.organization_id=p_org and v.active and t.active
 and (v.user_id=t.user_id or v.role in ('owner','admin') or exists(select 1 from ancestors a where a.target_id=t.user_id and a.ancestor_id=v.user_id and ((v.role='manager' and a.depth>0) or (v.role='supervisor' and a.depth=1))))
 and exists(select 1 from public.organizations where id=p_org and active);
end $$;
create function public.create_workspace_organization(p_actor uuid,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$
declare org uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='owner' and status='active') then raise exception 'FORBIDDEN'; end if;
 insert into public.organizations(name) values(p_name) returning id into org;
 insert into public.organization_memberships values(org,p_actor,coalesce(nullif((select full_name from public.profiles where id=p_actor),''),'Dirección'),'owner',null,true);
 perform public.rebuild_organization_access(org);
 insert into public.organization_audit_log(organization_id,actor_id,action) values(org,p_actor,'organization_created');
 return org;
end $$;
create function public.update_workspace_member(p_org uuid,p_actor uuid,p_target uuid,p_role text,p_reports uuid,p_active boolean) returns void language plpgsql security invoker set search_path='' as $$
declare actor_role text; target_role text;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found then raise exception 'ORGANIZATION_UNAVAILABLE'; end if;
 select role into actor_role from public.organization_memberships where organization_id=p_org and user_id=p_actor and active;
 if actor_role is null or actor_role not in ('owner','admin') then raise exception 'FORBIDDEN'; end if;
 select role into target_role from public.organization_memberships where organization_id=p_org and user_id=p_target;
 if target_role is null then raise exception 'UNKNOWN_MEMBER'; end if;
 if actor_role<>'owner' and (p_role='owner' or target_role='owner') then raise exception 'OWNER_ONLY'; end if;
 update public.organization_memberships set role=p_role,reports_to=p_reports,active=p_active where organization_id=p_org and user_id=p_target;
 perform public.rebuild_organization_access(p_org);
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_target,'membership_updated',jsonb_build_object('previous_role',target_role,'role',p_role,'reports_to',p_reports,'active',p_active));
end $$;
create function public.create_workspace_invitation(p_org uuid,p_actor uuid,p_email text,p_role text,p_reports uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare invite uuid;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found then raise exception 'ORGANIZATION_UNAVAILABLE'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin')) then raise exception 'FORBIDDEN'; end if;
 if p_reports is not null and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_reports and active and role<>'learner') then raise exception 'INVALID_MANAGER'; end if;
 if length(p_email)>200 or p_email<>lower(p_email) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'INVALID_EMAIL'; end if;
 insert into public.organization_invitations(organization_id,email,role,reports_to,created_by) values(p_org,p_email,p_role,p_reports,p_actor) returning id into invite;
 insert into public.organization_audit_log(organization_id,actor_id,action) values(p_org,p_actor,'invitation_created');
 return invite;
end $$;
create function public.accept_workspace_invitation(p_invite uuid,p_actor uuid,p_verified_email text,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.organization_invitations;
begin
 perform 1 from public.organizations where id=(select organization_id from public.organization_invitations where id=p_invite) and active for update;
 if not found then raise exception 'ORGANIZATION_UNAVAILABLE'; end if;
 select * into invitation from public.organization_invitations where id=p_invite for update;
 if invitation.id is null or p_verified_email is null or invitation.email<>lower(p_verified_email) then raise exception 'FORBIDDEN'; end if;
 if invitation.accepted_user_id=p_actor then return invitation.organization_id; end if;
 if invitation.accepted_user_id is not null or invitation.expires_at<=now() then raise exception 'INVITATION_UNAVAILABLE'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=invitation.organization_id and user_id=invitation.created_by and active and role in ('owner','admin')) then raise exception 'INVITATION_UNAVAILABLE'; end if;
 insert into public.organization_memberships values(invitation.organization_id,p_actor,p_name,invitation.role,invitation.reports_to,true);
 perform public.rebuild_organization_access(invitation.organization_id);
 update public.organization_invitations set accepted_user_id=p_actor,accepted_at=now() where id=p_invite;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action) values(invitation.organization_id,p_actor,p_actor,'invitation_accepted');
 return invitation.organization_id;
end $$;
create function public.issue_workspace_diploma(p_user uuid,p_level integer) returns setof public.issued_block_diplomas language plpgsql security invoker set search_path='' as $$
declare block public.levels; snapshot jsonb;
begin
 if p_level not between 1 and 15 then raise exception 'INVALID_BLOCK'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':diploma:'||p_level::text,0));
 if exists(select 1 from public.issued_block_diplomas where user_id=p_user and level_number=p_level) then
  return query select * from public.issued_block_diplomas where user_id=p_user and level_number=p_level; return;
 end if;
 select * into strict block from public.levels where level_number=p_level and status='published';
 if block.id is null then raise exception 'INVALID_BLOCK'; end if;
 if not exists(select 1 from public.lessons where level_id=block.id and status='published') or not exists(select 1 from public.level_exams where level_id=block.id and status='published') then raise exception 'BLOCK_INCOMPLETE'; end if;
 if exists(select 1 from public.lessons l where l.level_id=block.id and l.status='published' and not exists(select 1 from public.lesson_progress p where p.user_id=p_user and p.lesson_id=l.id and p.status='completed'))
 or exists(select 1 from public.level_exams e where e.level_id=block.id and e.status='published' and not exists(select 1 from public.exam_attempts a where a.user_id=p_user and a.exam_id=e.id and a.passed))
 or exists(select 1 from public.level_projects p where p.level_id=block.id and p.status='published' and not exists(select 1 from public.project_submissions s where s.user_id=p_user and s.project_id=p.id and s.status='approved')) then raise exception 'BLOCK_INCOMPLETE'; end if;
 snapshot=jsonb_build_object('version',1,'lessons',(select jsonb_agg(id order by id) from public.lessons where level_id=block.id and status='published'),'exams',(select jsonb_agg(id order by id) from public.level_exams where level_id=block.id and status='published'),'projects',coalesce((select jsonb_agg(id order by id) from public.level_projects where level_id=block.id and status='published'),'[]'::jsonb));
 insert into public.issued_block_diplomas(user_id,level_number,learner_name,block_title,requirements)
 values(p_user,p_level,coalesce(nullif((select full_name from public.profiles where id=p_user),''),'Estudiante CodeZero'),block.title,snapshot);
 return query select * from public.issued_block_diplomas where user_id=p_user and level_number=p_level;
end $$;
create function public.assign_workspace_activity(p_org uuid,p_actor uuid,p_user uuid,p_type text,p_id bigint,p_competency text) returns void language plpgsql security invoker set search_path='' as $$
declare activity_title text;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found then raise exception 'ORGANIZATION_UNAVAILABLE'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin')) then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_user and active) then raise exception 'UNKNOWN_MEMBER'; end if;
 if p_type='lesson' then select title into activity_title from public.lessons where id=p_id and status='published';
 elsif p_type='exam' then select title into activity_title from public.level_exams where id=p_id and status='published';
 elsif p_type='project' then select title into activity_title from public.level_projects where id=p_id and status='published'; end if;
 if activity_title is null then raise exception 'INVALID_ACTIVITY'; end if;
 insert into public.learning_assignments(organization_id,user_id,activity_key,activity_type,activity_id,title,competency)
 values(p_org,p_user,p_type||':'||p_id::text,p_type,p_id,activity_title,p_competency) on conflict do nothing;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'activity_assigned',jsonb_build_object('type',p_type,'id',p_id));
end $$;
create function public.refresh_workspace_evidence(p_org uuid,p_actor uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from codezero_private.organization_access where organization_id=p_org and viewer_id=p_actor) then raise exception 'FORBIDDEN'; end if;
 insert into public.learning_evidence(organization_id,user_id,activity_key,completed,score)
 select a.organization_id,a.user_id,a.activity_key,
 case a.activity_type
 when 'lesson' then exists(select 1 from public.lesson_progress p where p.user_id=a.user_id and p.lesson_id=a.activity_id and p.status='completed')
 when 'exam' then exists(select 1 from public.exam_attempts e where e.user_id=a.user_id and e.exam_id=a.activity_id and e.passed)
 when 'project' then exists(select 1 from public.project_submissions p where p.user_id=a.user_id and p.project_id=a.activity_id and p.status='approved') end,
 case a.activity_type
 when 'exam' then (select max(score) from public.exam_attempts e where e.user_id=a.user_id and e.exam_id=a.activity_id)
 when 'project' then (select max(score) from public.project_submissions p where p.user_id=a.user_id and p.project_id=a.activity_id) else null end
 from public.learning_assignments a where a.organization_id=p_org and exists(select 1 from codezero_private.organization_access v where v.organization_id=p_org and v.viewer_id=p_actor and v.target_id=a.user_id)
 on conflict(organization_id,user_id,activity_key) do update set completed=excluded.completed,score=excluded.score,observed_at=now();
 insert into public.learning_errors(organization_id,user_id,activity_key,event_key,category,occurred_at)
 select a.organization_id,a.user_id,a.activity_key,'exam:'||e.id::text,'exam_not_passed',e.created_at
 from public.learning_assignments a join public.exam_attempts e on a.activity_type='exam' and a.activity_id=e.exam_id and a.user_id=e.user_id and not e.passed
 where a.organization_id=p_org and e.created_at>=now()-interval '90 days' and exists(select 1 from codezero_private.organization_access v where v.organization_id=p_org and v.viewer_id=p_actor and v.target_id=a.user_id)
 on conflict do nothing;
 insert into public.learning_errors(organization_id,user_id,activity_key,event_key,category,occurred_at)
 select a.organization_id,a.user_id,a.activity_key,'project:'||p.id::text,'project_needs_revision',p.updated_at
 from public.learning_assignments a join public.project_submissions p on a.activity_type='project' and a.activity_id=p.project_id and a.user_id=p.user_id and p.status='needs_revision'
 where a.organization_id=p_org and p.updated_at>=now()-interval '90 days' and exists(select 1 from codezero_private.organization_access v where v.organization_id=p_org and v.viewer_id=p_actor and v.target_id=a.user_id)
 on conflict do nothing;
 delete from public.learning_errors where organization_id=p_org and occurred_at<now()-interval '90 days';
end $$;
revoke all on function public.assign_workspace_activity(uuid,uuid,uuid,text,bigint,text),public.refresh_workspace_evidence(uuid,uuid) from public,anon,authenticated;
grant execute on function public.assign_workspace_activity(uuid,uuid,uuid,text,bigint,text),public.refresh_workspace_evidence(uuid,uuid) to service_role;
revoke all on function public.rebuild_organization_access(uuid),public.create_workspace_organization(uuid,text),public.update_workspace_member(uuid,uuid,uuid,text,uuid,boolean),public.create_workspace_invitation(uuid,uuid,text,text,uuid),public.accept_workspace_invitation(uuid,uuid,text,text),public.issue_workspace_diploma(uuid,integer) from public,anon,authenticated;
grant execute on function public.rebuild_organization_access(uuid),public.create_workspace_organization(uuid,text),public.update_workspace_member(uuid,uuid,uuid,text,uuid,boolean),public.create_workspace_invitation(uuid,uuid,text,text,uuid),public.accept_workspace_invitation(uuid,uuid,text,text),public.issue_workspace_diploma(uuid,integer) to service_role;

create table public.private_practice_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 progress jsonb not null,
 revision integer not null default 1 check(revision > 0),
 updated_at timestamptz not null default now(),
 constraint bounded_private_progress check (
  jsonb_typeof(progress) = 'object' and octet_length(progress::text) <= 4000
  and progress ?& array['version','role','passed','startDay','onboarding','pulse']
  and progress - array['version','role','passed','startDay','onboarding','pulse'] = '{}'::jsonb
  and jsonb_typeof(progress->'version') = 'string' and progress->>'version' = 'samples-v1'
  and jsonb_typeof(progress->'role') = 'string' and progress->>'role' in ('technical_cs','support','integrations')
  and jsonb_typeof(progress->'passed') = 'array' and jsonb_array_length(progress->'passed') <= 11
  and progress->'passed' <@ '["handoff","python-output","python-error","sql-filter","support-note","safe-webhook","api-11","api-12","api-13","api-14","api-15"]'::jsonb
  and jsonb_typeof(progress->'onboarding') = 'array' and jsonb_array_length(progress->'onboarding') <= 7
  and progress->'onboarding' <@ '[0,1,2,3,4,5,6]'::jsonb
  and jsonb_typeof(progress->'pulse') = 'string' and length(progress->>'pulse') <= 500
  and jsonb_typeof(progress->'startDay') = 'string'
  and (progress->>'startDay' = '' or progress->>'startDay' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$')
 )
);
alter table public.private_practice_progress enable row level security;
revoke all on public.private_practice_progress from public, anon, authenticated;
grant select, insert, update on public.private_practice_progress to authenticated;
create policy private_practice_read on public.private_practice_progress for select to authenticated
using (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy private_practice_insert on public.private_practice_progress for insert to authenticated
with check (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy private_practice_update on public.private_practice_progress for update to authenticated
using (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'))
with check (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));

create function public.save_private_practice_progress(p_progress jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare actor uuid := auth.uid(); current_revision integer; next_revision integer;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and status='active') then
  raise exception 'Active user required' using errcode='42501';
 end if;
 if p_revision is null or p_revision < 0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('private-practice:'||actor::text,0));
 select revision into current_revision from public.private_practice_progress where user_id=actor for update;
 if coalesce(current_revision,0) <> p_revision then raise exception 'Progress changed in another tab' using errcode='40001'; end if;
 if current_revision is null then
  insert into public.private_practice_progress(user_id,progress) values(actor,p_progress) returning revision into next_revision;
 else
  update public.private_practice_progress set progress=p_progress,revision=current_revision+1,updated_at=now()
  where user_id=actor returning revision into next_revision;
 end if;
 return next_revision;
end $$;
revoke all on function public.save_private_practice_progress(jsonb,integer) from public,anon;
grant execute on function public.save_private_practice_progress(jsonb,integer) to authenticated;
create table public.addons (
 key text primary key check(key ~ '^[a-z][a-z0-9_]{1,63}$'),
 label text not null check(length(label) between 1 and 120),
 billing_type text not null check(billing_type in ('monthly','one_time')),
 entitlement_key text not null,
 monthly_limit integer check(monthly_limit > 0),
 status text not null default 'coming_soon' check(status in ('active','coming_soon'))
);
create table public.addon_waitlist (
 user_id uuid not null references auth.users(id) on delete cascade,
 addon_key text not null references public.addons(key),
 created_at timestamptz not null default now(),
 primary key(user_id,addon_key)
);
create index addon_waitlist_interest on public.addon_waitlist(addon_key);
alter table public.addons enable row level security;
alter table public.addon_waitlist enable row level security;
revoke all on public.addons,public.addon_waitlist from public,anon,authenticated;
grant select on public.addons to authenticated;
grant select,insert,delete on public.addon_waitlist to authenticated;
create policy addon_catalog_active_account on public.addons for select to authenticated
using(exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy waitlist_own_read on public.addon_waitlist for select to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy waitlist_own_insert on public.addon_waitlist for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active')
 and exists(select 1 from public.addons where key=addon_key and status='coming_soon'));
create policy waitlist_own_delete on public.addon_waitlist for delete to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
insert into public.addons(key,label,billing_type,entitlement_key,monthly_limit,status) values
('ai_tutor','Tutor IA','monthly','ai_tutor',100,'coming_soon'),
('route_customer_success','Ruta de Customer Success','monthly','route_customer_success',null,'coming_soon'),
('route_operations','Operaciones · RevOps, Sales Ops y CS Ops','monthly','route_operations',null,'coming_soon'),
('route_qa','QA / Tester','monthly','route_qa',null,'coming_soon'),
('route_data_bi','Analista de datos / BI','monthly','route_data_bi',null,'coming_soon'),
('route_product','Producto · Product Owner / Product Manager','monthly','route_product',null,'coming_soon'),
('route_management','Management','monthly','route_management',null,'coming_soon'),
('route_solutions_integrations','Solutions Engineer / Integraciones','monthly','route_solutions_integrations',null,'coming_soon'),
('route_enablement','Capacitación y Enablement','monthly','route_enablement',null,'coming_soon'),
('route_growth','Marketing digital / Growth','monthly','route_growth',null,'coming_soon'),
('routes_three','Tres rutas profesionales','monthly','routes_three',null,'coming_soon'),
('routes_all','Todas las rutas','monthly','routes_all',null,'coming_soon'),
('ai_simulator','Simulador de situaciones','monthly','ai_simulator',20,'coming_soon'),
('tool_labs','Laboratorios de herramientas','monthly','tool_labs',null,'coming_soon'),
('extra_quota','Cuota extra','one_time','extra_quota',null,'coming_soon'),
('verified_certificate','Certificado verificable','one_time','verified_certificate',null,'coming_soon'),
('deep_diagnostic','Diagnóstico profundo','one_time','deep_diagnostic',null,'coming_soon'),
('employment_kit','Kit de empleabilidad','one_time','employment_kit',null,'coming_soon'),
('mentoring','Mentoría 1:1','one_time','mentoring',null,'coming_soon');
create index organization_access_target_idx on codezero_private.organization_access(organization_id,target_id);
create index learning_errors_assignment_idx on public.learning_errors(organization_id,user_id,activity_key);
create index organization_audit_actor_idx on public.organization_audit_log(actor_id);
create index organization_audit_target_idx on public.organization_audit_log(target_id);
create index organization_invitation_accepted_idx on public.organization_invitations(accepted_user_id);
create index organization_invitation_creator_idx on public.organization_invitations(created_by);
create index organization_invitation_reports_idx on public.organization_invitations(organization_id,reports_to);
create index organization_membership_user_idx on public.organization_memberships(user_id);

create or replace function public.save_private_practice_progress(p_progress jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare actor uuid := auth.uid(); current_revision integer; next_revision integer;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and status='active') then
  raise exception 'Active user required' using errcode='42501';
 end if;
 if p_revision is null or p_revision < 0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('private-practice:'||actor::text,0));
 select revision into current_revision from public.private_practice_progress where user_id=actor for update;
 if coalesce(current_revision,0) <> p_revision then raise exception 'Progress changed in another tab' using errcode='PT409'; end if;
 if current_revision is null then
  insert into public.private_practice_progress(user_id,progress) values(actor,p_progress) returning revision into next_revision;
 else
  update public.private_practice_progress set progress=p_progress,revision=current_revision+1,updated_at=now()
  where user_id=actor returning revision into next_revision;
 end if;
 return next_revision;
end $$;
commit;

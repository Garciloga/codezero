-- Additive company/workgroup layer. Existing organization IDs are companies.
begin;
-- Narrow internal Auth lookup: no direct service_role grant on auth.users.
create function codezero_private.company_verified_email(p_user uuid) returns text language sql stable security definer set search_path='' as $$
 select lower(email) from auth.users where id=p_user and email_confirmed_at is not null
$$;
revoke all on function codezero_private.company_verified_email(uuid) from public,anon,authenticated;
grant execute on function codezero_private.company_verified_email(uuid) to service_role;
create table public.organization_contracts (
 organization_id uuid primary key references public.organizations(id),
 reference text not null unique check(length(reference) between 3 and 200),
 seat_limit integer not null check(seat_limit between 1 and 100000),
 plan_name text not null check(plan_name in ('starter','pro','enterprise')),
 valid_until timestamptz not null, active boolean not null default true,
 recorded_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table public.organization_teams (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check(length(name) between 2 and 120), unique(organization_id,id),unique(organization_id,name)
);
create table public.organization_team_members (
 organization_id uuid not null,team_id uuid not null,user_id uuid not null,
 primary key(organization_id,team_id,user_id),
 foreign key(organization_id,team_id) references public.organization_teams(organization_id,id) on delete cascade,
 foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id) on delete cascade
);
create table public.organization_team_grants (
 organization_id uuid not null,team_id uuid not null,user_id uuid not null,
 can_view boolean not null default false,can_invite boolean not null default false,
 primary key(organization_id,team_id,user_id),
 foreign key(organization_id,team_id) references public.organization_teams(organization_id,id) on delete cascade,
 foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id) on delete cascade
);
alter table public.organizations add column logo_version uuid,add column cover_version uuid;
alter table public.organization_memberships add column can_brand boolean not null default false;
alter table public.organization_invitations add column team_id uuid,add column revoked_at timestamptz,
 add column email_status text not null default 'prepared' check(email_status in ('prepared','sending','queued','failed')),add column email_provider_id text,add column email_started_at timestamptz,
 add constraint invitation_team_fk foreign key(organization_id,team_id) references public.organization_teams(organization_id,id);
create index organization_team_members_user_idx on public.organization_team_members(organization_id,user_id);
create index organization_team_grants_user_idx on public.organization_team_grants(organization_id,user_id);
create index organization_invitation_reservations_idx on public.organization_invitations(organization_id,expires_at) where accepted_at is null and revoked_at is null;

create or replace function public.rebuild_organization_access(p_org uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.organizations where id=p_org for update;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and role='owner' and active) then raise exception 'LAST_OWNER';end if;
 if exists(select 1 from public.organization_memberships c join public.organization_memberships p on p.organization_id=c.organization_id and p.user_id=c.reports_to where c.organization_id=p_org and (p.role='learner' or (c.active and not p.active))) then raise exception 'INVALID_MANAGER';end if;
 if exists(with recursive path as (
 select user_id,reports_to,array[user_id] ids,false cycle from public.organization_memberships where organization_id=p_org
 union all select t.user_id,m.reports_to,t.ids||m.user_id,m.user_id=any(t.ids) from path t join public.organization_memberships m on m.organization_id=p_org and m.user_id=t.reports_to where not t.cycle
 ) select 1 from path where cycle) then raise exception 'HIERARCHY_CYCLE';end if;
 delete from codezero_private.organization_access where organization_id=p_org;
 insert into codezero_private.organization_access(organization_id,viewer_id,target_id,can_manage)
 with recursive ancestors as (
 select user_id target_id,user_id ancestor_id,reports_to,0 depth from public.organization_memberships where organization_id=p_org and active
 union all select a.target_id,m.user_id,m.reports_to,a.depth+1 from ancestors a join public.organization_memberships m on m.organization_id=p_org and m.user_id=a.reports_to and m.active
 ) select distinct p_org,v.user_id,t.user_id,v.role in ('owner','admin')
 from public.organization_memberships v cross join public.organization_memberships t
 where v.organization_id=p_org and t.organization_id=p_org and v.active and t.active
 and exists(select 1 from public.organizations where id=p_org and active)
 and (v.user_id=t.user_id or v.role in ('owner','admin') or
 exists(select 1 from public.organization_team_grants g join public.organization_team_members tm on tm.organization_id=g.organization_id and tm.team_id=g.team_id where g.organization_id=p_org and g.user_id=v.user_id and g.can_view and tm.user_id=t.user_id) or
 (exists(select 1 from ancestors a where a.target_id=t.user_id and a.ancestor_id=v.user_id and ((v.role='manager' and a.depth>0) or (v.role='supervisor' and a.depth=1)))
 and (not exists(select 1 from public.organization_team_members tm where tm.organization_id=p_org and tm.user_id=t.user_id)
 or exists(select 1 from public.organization_team_members vt join public.organization_team_members tt on tt.organization_id=vt.organization_id and tt.team_id=vt.team_id where vt.organization_id=p_org and vt.user_id=v.user_id and tt.user_id=t.user_id))));
end $$;

create function public.company_seat_usage(p_org uuid) returns integer language sql stable security invoker set search_path='' as $$
 select (select count(*) from public.organization_memberships where organization_id=p_org and active)::integer+
 (select count(distinct i.email) from public.organization_invitations i where i.organization_id=p_org and i.accepted_at is null and i.revoked_at is null and i.expires_at>now() and not exists(select 1 from public.organization_memberships m where m.organization_id=p_org and m.active and codezero_private.company_verified_email(m.user_id)=i.email))::integer
$$;
create function public.company_can_invite(p_org uuid,p_actor uuid,p_team uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=p_actor and p.status='active' and p.role in ('owner','admin')) or
 exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=p_org and m.user_id=p_actor and m.active and p.status='active' and (m.role in ('owner','admin') or exists(select 1 from public.organization_team_grants g where g.organization_id=p_org and g.team_id=p_team and g.user_id=p_actor and g.can_invite)))
$$;
create function public.provision_company_contract(p_actor uuid,p_name text,p_owner_email text,p_reference text,p_seats integer,p_plan text,p_until timestamptz) returns uuid language plpgsql security invoker set search_path='' as $$
declare org uuid; responsible uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_reference,0));
 if exists(select 1 from public.organization_contracts where reference=p_reference) then raise exception 'CONTRACT_EXISTS';end if;
 select p.id into responsible from public.profiles p where lower(p.email)=lower(trim(p_owner_email)) and codezero_private.company_verified_email(p.id)=lower(trim(p_owner_email)) and p.status='active';
 if responsible is null or p_until<=now() then raise exception 'INVALID_CONTRACT';end if;
 insert into public.organizations(name) values(trim(p_name)) returning id into org;
 insert into public.organization_contracts(organization_id,reference,seat_limit,plan_name,valid_until,recorded_by) values(org,trim(p_reference),p_seats,p_plan,p_until,p_actor);
 insert into public.organization_memberships(organization_id,user_id,display_name,role) values(org,responsible,coalesce(nullif((select full_name from public.profiles where id=responsible),''),'Responsable'),'owner');
 perform public.rebuild_organization_access(org);
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(org,p_actor,'contract_created',jsonb_build_object('reference',p_reference,'seats',p_seats,'responsible',responsible));return org;
end $$;
create function public.set_company_contract(p_actor uuid,p_org uuid,p_reference text,p_seats integer,p_plan text,p_until timestamptz,p_active boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 perform 1 from public.organizations where id=p_org for update;if not found then raise exception 'UNKNOWN_COMPANY';end if;
 if p_seats<public.company_seat_usage(p_org) or p_until<=now() then raise exception 'INVALID_CAPACITY';end if;
 insert into public.organization_contracts(organization_id,reference,seat_limit,plan_name,valid_until,active,recorded_by) values(p_org,trim(p_reference),p_seats,p_plan,p_until,p_active,p_actor)
 on conflict(organization_id) do update set reference=excluded.reference,seat_limit=excluded.seat_limit,plan_name=excluded.plan_name,valid_until=excluded.valid_until,active=excluded.active,recorded_by=p_actor,updated_at=now();
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'contract_updated',jsonb_build_object('reference',p_reference,'seats',p_seats,'active',p_active));
end $$;

create function public.create_company_invitation(p_org uuid,p_actor uuid,p_email text,p_role text,p_reports uuid,p_team uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation uuid; limit_seats integer; privileged boolean;
begin
 perform 1 from public.organizations where id=p_org and active for update;if not found then raise exception 'ORGANIZATION_UNAVAILABLE';end if;
 if not public.company_can_invite(p_org,p_actor,p_team) then raise exception 'FORBIDDEN';end if;
 privileged=exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) or exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin'));
 if not privileged and (p_role<>'learner' or p_reports is not null and not exists(select 1 from codezero_private.organization_access where organization_id=p_org and viewer_id=p_actor and target_id=p_reports)) then raise exception 'FORBIDDEN_ROLE';end if;
 if p_role not in ('admin','manager','supervisor','learner') or length(p_email)>200 or p_email<>lower(trim(p_email)) or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'INVALID_INVITATION';end if;
 if p_team is not null and not exists(select 1 from public.organization_teams where organization_id=p_org and id=p_team) then raise exception 'UNKNOWN_TEAM';end if;
 if p_reports is not null and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_reports and active and role<>'learner') then raise exception 'INVALID_MANAGER';end if;
 if exists(select 1 from public.organization_memberships m where m.organization_id=p_org and m.active and codezero_private.company_verified_email(m.user_id)=p_email) then raise exception 'ALREADY_MEMBER';end if;
 select id into invitation from public.organization_invitations where organization_id=p_org and email=p_email and accepted_at is null and revoked_at is null and expires_at>now();
 if invitation is not null then
 if exists(select 1 from public.organization_invitations where id=invitation and role=p_role and reports_to is not distinct from p_reports and team_id is not distinct from p_team) and (privileged or exists(select 1 from public.organization_invitations where id=invitation and created_by=p_actor)) then return invitation;end if;
 raise exception 'INVITATION_EXISTS';end if;
 select seat_limit into limit_seats from public.organization_contracts where organization_id=p_org and active and valid_until>now();
 if limit_seats is null then raise exception 'NO_ACTIVE_CONTRACT';end if;
 if public.company_seat_usage(p_org)>=limit_seats then raise exception 'SEAT_LIMIT';end if;
 insert into public.organization_invitations(organization_id,email,role,reports_to,created_by,team_id) values(p_org,p_email,p_role,p_reports,p_actor,p_team) returning id into invitation;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'invitation_created',jsonb_build_object('invitation',invitation,'team',p_team));return invitation;
end $$;
create or replace function public.create_workspace_organization(p_actor uuid,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$begin raise exception 'CONTRACT_REQUIRED';end $$;
create or replace function public.create_workspace_invitation(p_org uuid,p_actor uuid,p_email text,p_role text,p_reports uuid) returns uuid language sql security invoker set search_path='' as $$select public.create_company_invitation(p_org,p_actor,p_email,p_role,p_reports,null)$$;
create or replace function public.accept_workspace_invitation(p_invite uuid,p_actor uuid,p_verified_email text,p_name text) returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.organization_invitations; limit_seats integer;
begin
 perform 1 from public.organizations where id=(select organization_id from public.organization_invitations where id=p_invite) and active for update;if not found then raise exception 'ORGANIZATION_UNAVAILABLE';end if;
 select * into invitation from public.organization_invitations where id=p_invite for update;
 if invitation.id is null or p_verified_email is null or invitation.email<>lower(p_verified_email) or not exists(select 1 from public.profiles p where p.id=p_actor and codezero_private.company_verified_email(p.id)=invitation.email and p.status='active') then raise exception 'FORBIDDEN';end if;
 if invitation.accepted_user_id=p_actor then return invitation.organization_id;end if;
 if invitation.accepted_user_id is not null or invitation.revoked_at is not null or invitation.expires_at<=now() or not public.company_can_invite(invitation.organization_id,invitation.created_by,invitation.team_id) then raise exception 'INVITATION_UNAVAILABLE';end if;
 select seat_limit into limit_seats from public.organization_contracts where organization_id=invitation.organization_id and active and valid_until>now();
 if limit_seats is null or public.company_seat_usage(invitation.organization_id)>limit_seats then raise exception 'SEAT_LIMIT';end if;
 if exists(select 1 from public.organization_memberships where organization_id=invitation.organization_id and user_id=p_actor and active) then raise exception 'ALREADY_MEMBER';end if;
 insert into public.organization_memberships(organization_id,user_id,display_name,role,reports_to,active) values(invitation.organization_id,p_actor,p_name,invitation.role,invitation.reports_to,true)
 on conflict(organization_id,user_id) do update set display_name=excluded.display_name,role=excluded.role,reports_to=excluded.reports_to,active=true;
 if invitation.team_id is not null then insert into public.organization_team_members values(invitation.organization_id,invitation.team_id,p_actor) on conflict do nothing;end if;
 perform public.rebuild_organization_access(invitation.organization_id);
 update public.organization_invitations set accepted_user_id=p_actor,accepted_at=now() where id=p_invite;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action) values(invitation.organization_id,p_actor,p_actor,'invitation_accepted');return invitation.organization_id;
end $$;

-- Membership reactivation cannot bypass invitations or consume unpurchased seats.
create function codezero_private.enforce_company_capacity() returns trigger language plpgsql security invoker set search_path='' as $$
declare seats integer; occupied integer;
begin
 if new.active and (TG_OP='INSERT' or not old.active) then
 perform 1 from public.organizations where id=new.organization_id for update;
 select seat_limit into seats from public.organization_contracts where organization_id=new.organization_id and active and valid_until>now();
 if seats is not null then
 occupied=public.company_seat_usage(new.organization_id);
 if exists(select 1 from public.organization_invitations i where i.organization_id=new.organization_id and i.email=codezero_private.company_verified_email(new.user_id) and i.accepted_at is null and i.revoked_at is null and i.expires_at>now()) then occupied=occupied-1;end if;
 if occupied>=seats then raise exception 'SEAT_LIMIT';end if;
 else raise exception 'NO_ACTIVE_CONTRACT';end if;
 end if;return new;
end $$;
create trigger company_capacity before insert or update of active on public.organization_memberships for each row execute function codezero_private.enforce_company_capacity();

create function public.configure_company_team(p_org uuid,p_actor uuid,p_team uuid,p_name text,p_user uuid,p_member boolean,p_view boolean,p_invite boolean) returns uuid language plpgsql security invoker set search_path='' as $$
declare team uuid:=p_team;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found or not exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=p_org and m.user_id=p_actor and m.active and m.role in ('owner','admin') and p.status='active') then raise exception 'FORBIDDEN';end if;
 if team is null then insert into public.organization_teams(organization_id,name) values(p_org,trim(p_name)) returning id into team;
 elsif not exists(select 1 from public.organization_teams where id=team and organization_id=p_org) then raise exception 'UNKNOWN_TEAM';end if;
 if p_user is not null then
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_user and active) then raise exception 'UNKNOWN_MEMBER';end if;
 if p_member then insert into public.organization_team_members values(p_org,team,p_user) on conflict do nothing;else delete from public.organization_team_members where organization_id=p_org and team_id=team and user_id=p_user;end if;
 insert into public.organization_team_grants values(p_org,team,p_user,coalesce(p_view,false),coalesce(p_invite,false)) on conflict(organization_id,team_id,user_id) do update set can_view=excluded.can_view,can_invite=excluded.can_invite;
 end if;
 perform public.rebuild_organization_access(p_org);
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'team_configured',jsonb_build_object('team',team,'member',p_member,'view',p_view,'invite',p_invite));return team;
end $$;
create function public.revoke_company_invitation(p_org uuid,p_actor uuid,p_invite uuid) returns void language plpgsql security invoker set search_path='' as $$
declare invitation public.organization_invitations;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 select * into invitation from public.organization_invitations where id=p_invite and organization_id=p_org;
 if invitation.id is null or not public.company_can_invite(p_org,p_actor,invitation.team_id) or invitation.accepted_at is not null or (invitation.created_by<>p_actor and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin')) and not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin'))) then raise exception 'FORBIDDEN';end if;
 update public.organization_invitations set revoked_at=now() where id=p_invite;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'invitation_revoked',jsonb_build_object('invitation',p_invite));
end $$;
create or replace function public.workspace_directory(p_org uuid,p_actor uuid) returns table(user_id uuid,display_name text,role text,reports_to uuid,active boolean,job_title text) language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active) then raise exception 'FORBIDDEN';end if;
 return query select m.user_id,m.display_name,m.role,m.reports_to,m.active,m.job_title from public.organization_memberships m join codezero_private.organization_access a on a.organization_id=m.organization_id and a.target_id=m.user_id where m.organization_id=p_org and m.active and a.viewer_id=p_actor order by m.display_name;
end $$;

do $$declare t text;begin
 foreach t in array array['organization_contracts','organization_teams','organization_team_members','organization_team_grants'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create policy contract_read on public.organization_contracts for select to authenticated using(exists(select 1 from public.organization_memberships m where m.organization_id=organization_contracts.organization_id and m.user_id=(select auth.uid()) and m.active and m.role in ('owner','admin')));
create policy teams_read on public.organization_teams for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_teams.organization_id and a.viewer_id=(select auth.uid()) and a.can_manage) or exists(select 1 from public.organization_team_members m where m.organization_id=organization_teams.organization_id and m.team_id=id and m.user_id=(select auth.uid())) or exists(select 1 from public.organization_team_grants g where g.organization_id=organization_teams.organization_id and g.team_id=id and g.user_id=(select auth.uid()) and (g.can_view or g.can_invite)));
create policy team_members_read on public.organization_team_members for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_team_members.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=user_id));
create policy team_grants_read on public.organization_team_grants for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_team_grants.organization_id and a.viewer_id=(select auth.uid())) or exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_team_grants.organization_id and a.viewer_id=(select auth.uid()) and a.can_manage));
create policy invitation_creator_read on public.organization_invitations for select to authenticated using(created_by=(select auth.uid()) and exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_invitations.organization_id and a.viewer_id=(select auth.uid())));

revoke all on function public.company_seat_usage(uuid),public.company_can_invite(uuid,uuid,uuid),public.provision_company_contract(uuid,text,text,text,integer,text,timestamptz),public.set_company_contract(uuid,uuid,text,integer,text,timestamptz,boolean),public.create_company_invitation(uuid,uuid,text,text,uuid,uuid),public.configure_company_team(uuid,uuid,uuid,text,uuid,boolean,boolean,boolean),public.revoke_company_invitation(uuid,uuid,uuid),codezero_private.enforce_company_capacity() from public,anon,authenticated;
grant execute on function public.company_seat_usage(uuid),public.company_can_invite(uuid,uuid,uuid),public.provision_company_contract(uuid,text,text,text,integer,text,timestamptz),public.set_company_contract(uuid,uuid,text,integer,text,timestamptz,boolean),public.create_company_invitation(uuid,uuid,text,text,uuid,uuid),public.configure_company_team(uuid,uuid,uuid,text,uuid,boolean,boolean,boolean),public.revoke_company_invitation(uuid,uuid,uuid),codezero_private.enforce_company_capacity() to service_role;
create function public.set_company_brand_permission(p_org uuid,p_actor uuid,p_target uuid,p_enabled boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found or not exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=p_org and m.user_id=p_actor and m.active and m.role in ('owner','admin') and p.status='active') then raise exception 'FORBIDDEN';end if;
 update public.organization_memberships set can_brand=p_enabled where organization_id=p_org and user_id=p_target and active;
 if not found then raise exception 'UNKNOWN_MEMBER';end if;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_target,'brand_permission',jsonb_build_object('enabled',p_enabled));
end $$;
revoke all on function public.set_company_brand_permission(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_company_brand_permission(uuid,uuid,uuid,boolean) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('company-brand','company-brand',false,2097152,array['image/webp']) on conflict(id) do nothing;
create policy company_brand_read on storage.objects for select to authenticated using(bucket_id='company-brand' and exists(select 1 from public.organization_memberships m where m.organization_id::text=split_part(name,'/',1) and m.user_id=(select auth.uid()) and m.active) and split_part(name,'/',2) ~ '^(logo|cover)-[0-9a-f-]{36}[.]webp$');
-- Writes pass through a verified, rate-limited server handler; no direct client write grants.
create function public.update_company_brand(p_org uuid,p_actor uuid,p_kind text,p_version uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found or p_kind not in ('logo','cover') or not exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=p_org and m.user_id=p_actor and m.active and p.status='active' and (m.role in ('owner','admin') or m.can_brand)) then raise exception 'FORBIDDEN';end if;
 if p_kind='logo' then update public.organizations set logo_version=p_version where id=p_org;else update public.organizations set cover_version=p_version where id=p_org;end if;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'company_brand_updated',jsonb_build_object('kind',p_kind));
end $$;
revoke all on function public.update_company_brand(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.update_company_brand(uuid,uuid,text,uuid) to service_role;
create function public.company_learning_plan(p_actor uuid,p_org uuid) returns text language sql stable security invoker set search_path='' as $$
 select c.plan_name from public.organization_contracts c join public.organization_memberships m on m.organization_id=c.organization_id join public.organizations o on o.id=c.organization_id join public.profiles p on p.id=m.user_id
 where m.user_id=p_actor and m.active and o.active and p.status='active' and c.active and c.valid_until>now() and (p_org is null or c.organization_id=p_org)
 order by case c.plan_name when 'enterprise' then 3 when 'pro' then 2 else 1 end desc limit 1
$$;
revoke all on function public.company_learning_plan(uuid,uuid) from public,anon,authenticated;
grant execute on function public.company_learning_plan(uuid,uuid) to service_role;
-- One effective education plan, retaining existing plan limits and personal billing.
create function codezero_private.effective_learning_plan(p_user uuid) returns text language plpgsql stable security definer set search_path='' as $$
declare personal text; company text;
begin
 if p_user is distinct from auth.uid() and current_setting('role',true)<>'service_role' then return null;end if;
 select plan_name into personal from public.profiles where id=p_user and status='active';
 if personal is null then return null;end if;
 company=public.company_learning_plan(p_user,null);
 if (case company when 'enterprise' then 3 when 'pro' then 2 when 'starter' then 1 else 0 end)>(case personal when 'enterprise' then 3 when 'pro' then 2 when 'starter' then 1 else 0 end) then return company;end if;return personal;
end $$;
revoke all on function codezero_private.effective_learning_plan(uuid) from public,anon;
grant execute on function codezero_private.effective_learning_plan(uuid) to authenticated,service_role;
create function public.claim_company_invitation_email(p_invite uuid,p_actor uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare i public.organization_invitations;
begin
 select * into i from public.organization_invitations where id=p_invite for update;
 if i.id is null or not public.company_can_invite(i.organization_id,p_actor,i.team_id) or i.accepted_at is not null or i.revoked_at is not null or i.expires_at<=now() then raise exception 'FORBIDDEN';end if;
 if i.created_by<>p_actor and not exists(select 1 from public.organization_memberships where organization_id=i.organization_id and user_id=p_actor and active and role in ('owner','admin')) and not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 if i.email_status='queued' or i.email_status='sending' and i.email_started_at>now()-interval '60 seconds' then return false;end if;
 -- Do not retry an uncertain send after the provider's 24-hour idempotency window.
 if i.email_started_at is not null and i.email_started_at<now()-interval '23 hours' then return false;end if;
 update public.organization_invitations set email_status='sending',email_started_at=coalesce(email_started_at,now()) where id=p_invite;return true;
end $$;
revoke all on function public.claim_company_invitation_email(uuid,uuid) from public,anon,authenticated;grant execute on function public.claim_company_invitation_email(uuid,uuid) to service_role;
commit;

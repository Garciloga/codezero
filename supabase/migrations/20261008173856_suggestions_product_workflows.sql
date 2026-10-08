-- Additive product workflows; existing Auth, scopes, RLS and plan quotas are unchanged.
alter table public.user_preferences add column news_read text;
create table public.organization_setup_drafts(organization_id uuid primary key references public.organizations(id) on delete cascade,operator_id uuid not null references public.profiles(id),step integer not null check(step between 1 and 4),updated_at timestamptz not null default now());
create table public.activation_events(user_id uuid not null references public.profiles(id) on delete cascade,event text not null check(event in ('registered','first_lesson','first_submission','first_assignment','week_return')),observed_at timestamptz not null default now(),primary key(user_id,event));
create index activation_events_observed_idx on public.activation_events(observed_at);
create table public.public_portfolios(user_id uuid primary key references public.profiles(id) on delete cascade,share_token uuid not null unique default gen_random_uuid(),published boolean not null default false,display_name text not null check(length(display_name) between 2 and 120),evidence_ids uuid[] not null default '{}',certificate_ids uuid[] not null default '{}',competency_keys text[] not null default '{}',consent_at timestamptz,updated_at timestamptz not null default now(),check(cardinality(evidence_ids)<=100 and cardinality(certificate_ids)<=100 and cardinality(competency_keys)<=10),check(not published or consent_at is not null));
alter table public.organization_setup_drafts enable row level security;
alter table public.activation_events enable row level security;
alter table public.public_portfolios enable row level security;
revoke all on public.organization_setup_drafts,public.activation_events,public.public_portfolios from public,anon,authenticated;
grant all on public.organization_setup_drafts,public.activation_events,public.public_portfolios to service_role;
create function public.log_monthly_report_download(p_actor uuid,p_org uuid,p_month text,p_format text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN';end if;
 if p_month!~'^\d{4}-(0[1-9]|1[0-2])$' or p_format not in ('csv','pdf') then raise exception 'INVALID_REPORT';end if;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'monthly_report_downloaded',jsonb_build_object('month',p_month,'format',p_format));
end $$;
create function public.setup_company_member(p_actor uuid,p_org uuid,p_target uuid,p_role text,p_reports uuid,p_job_title text) returns void language plpgsql security invoker set search_path='' as $$
declare responsible uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 if p_role='owner' and not exists(select 1 from public.profiles where id=p_actor and role='owner') then raise exception 'FORBIDDEN';end if;
 select user_id into responsible from public.organization_memberships where organization_id=p_org and active and role='owner' order by user_id limit 1;
 if responsible is null or length(coalesce(p_job_title,''))>120 then raise exception 'INVALID_SETUP';end if;
 -- Existing company owner RPC checks hierarchy, ownership, cycles and capacity; no new membership is granted to the operator.
 perform public.update_workspace_member_details(p_org,responsible,p_target,p_role,p_reports,true,p_job_title);
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_target,'operator_setup_member',jsonb_build_object('owner_context',responsible));
end $$;
create function public.assign_weekly_case(p_actor uuid,p_org uuid,p_user uuid,p_activity bigint,p_due timestamptz) returns void language plpgsql security invoker set search_path='' as $$
declare a public.learning_activity_catalog; publish_date timestamptz;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join codezero_private.organization_access v on v.organization_id=m.organization_id and v.viewer_id=p_actor and v.target_id=p_user where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN';end if;
 select * into a from public.learning_activity_catalog where id=p_activity and active and kind='project' and content_key~'^weekly-faro-[1-8]$';
 if not found or p_due is null or p_due<=now() then raise exception 'INVALID_ACTIVITY';end if;
 publish_date='2026-10-08T00:00:00-06:00'::timestamptz+(substring(a.content_key from '[1-8]$')::int-1)*interval '7 days';
 if publish_date>now() then raise exception 'NOT_PUBLISHED';end if;
 insert into public.learning_assignments(organization_id,user_id,activity_key,activity_type,activity_id,title,competency,due_at,assigned_by) values(p_org,p_user,'route_unit:'||a.id,'route_unit',a.id,a.title,a.competencies[1],p_due,p_actor) on conflict(organization_id,user_id,activity_key) do update set due_at=excluded.due_at,assigned_by=excluded.assigned_by;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'weekly_case_assigned',jsonb_build_object('activity',p_activity,'due',p_due));
end $$;
create function codezero_private.capture_activation() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; label text;
begin
 if tg_table_name='profiles' then target=new.id;label='registered';
 elsif tg_table_name='lesson_progress' then if new.status<>'completed' then return new;end if;target=new.user_id;label='first_lesson';
 elsif tg_table_name='learning_assignments' then target=new.user_id;label='first_assignment';
 else target=new.user_id;label='first_submission';end if;
 insert into public.activation_events(user_id,event) values(target,label) on conflict do nothing;return new;
end $$;
revoke all on function codezero_private.capture_activation() from public,anon,authenticated;
create trigger capture_registration after insert on public.profiles for each row execute function codezero_private.capture_activation();
create trigger capture_first_lesson after insert or update of status on public.lesson_progress for each row execute function codezero_private.capture_activation();
create trigger capture_first_project after insert on public.project_submissions for each row execute function codezero_private.capture_activation();
create trigger capture_first_practice after insert on public.learning_practice_submissions for each row execute function codezero_private.capture_activation();
create trigger capture_first_assignment after insert on public.learning_assignments for each row execute function codezero_private.capture_activation();
insert into public.activation_events(user_id,event,observed_at) select id,'registered',created_at from public.profiles where created_at>=now()-interval '90 days' on conflict do nothing;
create function public.record_activation_return(p_user uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_user and status='active') then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from public.profiles where id=p_user and created_at<=now()-interval '7 days' and created_at>now()-interval '90 days') then insert into public.activation_events(user_id,event) values(p_user,'week_return') on conflict do nothing;end if;
end $$;
create function public.activation_cohorts(p_actor uuid) returns table(week timestamptz,registered bigint,first_lesson bigint,first_submission bigint,first_assignment bigint,week_return bigint) language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 return query select date_trunc('week',p.created_at),count(distinct e.user_id) filter(where e.event='registered'),count(distinct e.user_id) filter(where e.event='first_lesson'),count(distinct e.user_id) filter(where e.event='first_submission'),count(distinct e.user_id) filter(where e.event='first_assignment'),count(distinct e.user_id) filter(where e.event='week_return') from public.activation_events e join public.profiles p on p.id=e.user_id where e.observed_at>=now()-interval '90 days' group by 1 order by 1 desc;
end $$;
revoke all on function public.log_monthly_report_download(uuid,uuid,text,text),public.setup_company_member(uuid,uuid,uuid,text,uuid,text),public.assign_weekly_case(uuid,uuid,uuid,bigint,timestamptz),public.record_activation_return(uuid),public.activation_cohorts(uuid) from public,anon,authenticated;
grant execute on function public.log_monthly_report_download(uuid,uuid,text,text),public.setup_company_member(uuid,uuid,uuid,text,uuid,text),public.assign_weekly_case(uuid,uuid,uuid,bigint,timestamptz),public.record_activation_return(uuid),public.activation_cohorts(uuid) to service_role;

insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values
('weekly-faro-1','common','Faro · primer valor comprobable','project',array['data','diagnosis']),
('weekly-faro-2','common','Faro · incidente y comunicación','project',array['technical','communication']),
('weekly-faro-3','common','Faro · renovación con evidencia','project',array['negotiation','planning']),
('weekly-faro-4','common','Faro · capacidad y prioridades','project',array['prioritization','collaboration']),
('weekly-faro-5','common','Faro · adopción y calidad de datos','project',array['data','documentation']),
('weekly-faro-6','common','Faro · traspaso reproducible','project',array['diagnosis','documentation']),
('weekly-faro-7','common','Faro · expansión responsable','project',array['negotiation','data']),
('weekly-faro-8','common','Faro · autonomía y seguimiento','project',array['planning','collaboration'])
on conflict(content_key) do nothing;
-- Retention runs in the database even when the application has no traffic.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('garciloga-activation-retention','0 * * * *',$$delete from public.activation_events where observed_at<now()-interval '90 days'$$);

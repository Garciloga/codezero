-- Production release explicitly authorized by Isaac on 2026-10-07 (CDMX).
-- Consolidates the five reviewed sandbox migrations and the idempotent catalog seed.
set local lock_timeout = '5s';
-- Source: 20261008032420_role_training_phases_0_1.sql
-- Additive sandbox extension. Never run against production without a separate approval.
create table public.learning_activity_catalog (
 id bigint generated always as identity primary key,
 content_key text not null unique, route_key text not null check(route_key in ('common','customer_success')),
 title text not null, kind text not null check(kind in ('exercise','deliverable','project','capstone')),
 competencies text[] not null check(cardinality(competencies) between 1 and 3),
 version text not null default 'role-practice-v1', active boolean not null default true
);
create table public.learning_job_profiles (
 position_key text not null, version integer not null check(version>0),
 weights jsonb not null, expected jsonb not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
 primary key(position_key,version)
);
alter table public.profiles add column learning_position_key text;
alter table public.organization_memberships add column learning_position_key text;
alter table public.learning_assignments add column due_at timestamptz;
alter table public.learning_assignments add column reinforcement_before jsonb;
alter table public.learning_assignments add column reinforcement_after jsonb;
alter table public.learning_assignments add column assigned_by uuid references public.profiles(id);
-- Extend the accepted activity kinds; existing rows and validations are preserved.
alter table public.learning_assignments drop constraint learning_assignments_activity_type_check;
alter table public.learning_assignments add constraint learning_assignments_activity_type_check check(activity_type in ('lesson','exam','project','route_unit'));
create table public.learning_practice_submissions (
 id uuid primary key, user_id uuid not null references public.profiles(id), organization_id uuid references public.organizations(id),
 activity_id bigint not null references public.learning_activity_catalog(id), draft text not null check(length(draft)<=24000),
 self_scores jsonb not null, assistance text not null check(assistance in ('recognition','guided','independent')),
 answers jsonb not null, reevaluation_of uuid, created_at timestamptz not null default now(),
 unique(id,user_id)
);
create index learning_practice_user_idx on public.learning_practice_submissions(user_id,created_at);
create index learning_practice_org_idx on public.learning_practice_submissions(organization_id,user_id);
create index learning_practice_activity_idx on public.learning_practice_submissions(activity_id);
create table public.learning_evidence_history (
 id uuid primary key default gen_random_uuid(), submission_id uuid not null,
 user_id uuid not null references public.profiles(id), organization_id uuid references public.organizations(id),
 activity_key text not null, independent_key text not null,
 kind text not null check(kind in ('exercise','deliverable','project','capstone')),
 competency_scores jsonb not null, assistance text not null check(assistance in ('recognition','guided','independent')),
 review_source text not null check(review_source in ('auto','self','manager','admin')),
 reviewed_by uuid references public.profiles(id), observed_at timestamptz not null default now(),
 reevaluation_of uuid references public.learning_evidence_history(id), critical_errors text[] not null default '{}',
 feedback text check(length(feedback)<=6000), rubric_version text not null default 'competency-rubric-v1',
 foreign key(submission_id,user_id) references public.learning_practice_submissions(id,user_id) on delete cascade
);
alter table public.learning_practice_submissions add foreign key(reevaluation_of) references public.learning_evidence_history(id);
create index learning_history_user_date_idx on public.learning_evidence_history(user_id,observed_at);
create index learning_history_org_idx on public.learning_evidence_history(organization_id,user_id);
create index learning_history_submission_idx on public.learning_evidence_history(submission_id);
create index learning_history_reviewer_idx on public.learning_evidence_history(reviewed_by);
create index learning_history_reassessment_idx on public.learning_evidence_history(reevaluation_of);
create index learning_submission_reassessment_idx on public.learning_practice_submissions(reevaluation_of);
create index learning_profile_creator_idx on public.learning_job_profiles(created_by);
create index learning_assignment_actor_idx on public.learning_assignments(assigned_by);

alter table public.learning_activity_catalog enable row level security;
alter table public.learning_job_profiles enable row level security;
alter table public.learning_practice_submissions enable row level security;
alter table public.learning_evidence_history enable row level security;
revoke all on public.learning_activity_catalog,public.learning_job_profiles,public.learning_practice_submissions,public.learning_evidence_history from public,anon,authenticated;
grant select on public.learning_activity_catalog,public.learning_job_profiles,public.learning_practice_submissions,public.learning_evidence_history to authenticated;
grant all on public.learning_activity_catalog,public.learning_job_profiles,public.learning_practice_submissions,public.learning_evidence_history to service_role;
grant usage,select on sequence public.learning_activity_catalog_id_seq to service_role;
create policy training_catalog_read on public.learning_activity_catalog for select to authenticated using(active);
create policy training_profiles_read on public.learning_job_profiles for select to authenticated using(true);
create policy training_submission_read on public.learning_practice_submissions for select to authenticated using(
 user_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_practice_submissions.organization_id and a.target_id=user_id and a.viewer_id=(select auth.uid()))
);
create policy training_history_read on public.learning_evidence_history for select to authenticated using(
 user_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_evidence_history.organization_id and a.target_id=user_id and a.viewer_id=(select auth.uid()))
);

create function public.training_valid_scores(p_scores jsonb,p_competencies text[]) returns boolean language sql immutable security invoker set search_path='' as $$
 select p_scores is not null and jsonb_typeof(p_scores)='object'
 and (select count(*) from jsonb_each(p_scores))=cardinality(p_competencies)
 and not exists(select 1 from jsonb_each(p_scores) e where not (e.key=any(p_competencies)) or jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-4]$');
$$;
create function public.submit_training_practice(p_actor uuid,p_activity bigint,p_request uuid,p_org uuid,p_draft text,p_scores jsonb,p_assistance text,p_answers jsonb,p_auto_results jsonb,p_reevaluation uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare a public.learning_activity_catalog; old public.learning_practice_submissions; base public.learning_evidence_history; item jsonb; comp text; pos integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN';end if;
 if p_org is not null and not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active) then raise exception 'FORBIDDEN';end if;
 select * into a from public.learning_activity_catalog where id=p_activity and active;
 if not found then raise exception 'INVALID_ACTIVITY';end if;
 if p_request is null or p_draft is null or length(p_draft)>24000 or p_assistance not in ('recognition','guided','independent') or not public.training_valid_scores(p_scores,a.competencies) or p_answers is null or jsonb_typeof(p_answers)<>'array' or p_auto_results is null or jsonb_typeof(p_auto_results)<>'array' then raise exception 'INVALID_SUBMISSION';end if;
 if a.kind<>'exercise' and length(trim(p_draft))<120 then raise exception 'INCOMPLETE_DELIVERABLE';end if;
 if p_reevaluation is not null then
  select * into base from public.learning_evidence_history where id=p_reevaluation and user_id=p_actor and organization_id is not distinct from p_org and review_source in ('manager','admin') and assistance='independent' and cardinality(critical_errors)=0;
  if not found or now()<base.observed_at+interval '30 days' then raise exception 'REEVALUATION_NOT_DUE';end if;
 end if;
 -- Lock request IDs to serialize concurrent replay and prevent ownership changes.
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into old from public.learning_practice_submissions where id=p_request;
 if found then
  if old.user_id<>p_actor or old.activity_id<>p_activity or old.organization_id is distinct from p_org or old.draft<>p_draft or old.self_scores<>p_scores or old.answers<>p_answers or old.assistance<>p_assistance or old.reevaluation_of is distinct from p_reevaluation then raise exception 'REQUEST_CONFLICT';end if;
  return old.id;
 end if;
 insert into public.learning_practice_submissions(id,user_id,organization_id,activity_id,draft,self_scores,assistance,answers,reevaluation_of)
 values(p_request,p_actor,p_org,p_activity,p_draft,p_scores,p_assistance,p_answers,p_reevaluation);
 pos=0;
 for item in select value from jsonb_array_elements(p_auto_results) loop
  pos=pos+1;comp=a.competencies[1+((pos-1)%cardinality(a.competencies))];
  if jsonb_typeof(item)<>'number' or item::text not in ('0','1') then raise exception 'INVALID_GRADE';end if;
  insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source)
  values(p_request,p_actor,p_org,a.content_key,a.content_key||':decision:'||pos,'exercise',jsonb_build_object(comp,item),'recognition','auto');
 end loop;
 if a.kind<>'exercise' then
  insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reevaluation_of)
  values(p_request,p_actor,p_org,a.content_key,a.content_key,a.kind,p_scores,p_assistance,'self',p_reevaluation);
 end if;
 return p_request;
end $$;

create function public.review_training_practice(p_actor uuid,p_submission uuid,p_scores jsonb,p_feedback text,p_errors text[],p_expected uuid default null,p_assistance text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.learning_practice_submissions; a public.learning_activity_catalog; latest uuid; reviewer text; new_id uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN';end if;
 select * into s from public.learning_practice_submissions where id=p_submission for update;
 if not found then raise exception 'UNKNOWN_SUBMISSION';end if;
 select * into a from public.learning_activity_catalog where id=s.activity_id;
 if a.kind='exercise' then raise exception 'INVALID_REVIEW';end if;
 if exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then reviewer='admin';
 elsif a.kind='deliverable' and p_actor<>s.user_id and exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join codezero_private.organization_access v on v.organization_id=m.organization_id and v.viewer_id=p_actor and v.target_id=s.user_id where m.organization_id=s.organization_id and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then reviewer='manager';
 else raise exception 'FORBIDDEN';end if;
 if not public.training_valid_scores(p_scores,a.competencies) or p_feedback is null or length(trim(p_feedback))<40 or length(p_feedback)>6000 or p_errors is null or not p_errors<@array['data_exposure','unauthorized_change','invented_commitment','unverified_closure']::text[] or (p_assistance is not null and p_assistance not in ('guided','independent')) then raise exception 'INVALID_REVIEW';end if;
 select id into latest from public.learning_evidence_history where submission_id=p_submission and review_source in ('manager','admin') order by observed_at desc,id desc limit 1;
 if latest is distinct from p_expected then raise exception 'REVIEW_CONFLICT';end if;
 insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by,reevaluation_of,critical_errors,feedback)
 values(s.id,s.user_id,s.organization_id,a.content_key,a.content_key,a.kind,p_scores,coalesce(p_assistance,s.assistance),reviewer,p_actor,s.reevaluation_of,p_errors,p_feedback) returning id into new_id;
 if s.organization_id is not null then
  insert into public.learning_evidence(organization_id,user_id,activity_key,completed,score)
  select s.organization_id,s.user_id,'route_unit:'||a.id::text,cardinality(p_errors)=0 and not exists(select 1 from jsonb_each(p_scores) x where (x.value::text)::integer<3),
   (select round(avg((x.value::text)::numeric)*25)::integer from jsonb_each(p_scores) x)
  where exists(select 1 from public.learning_assignments where organization_id=s.organization_id and user_id=s.user_id and activity_key='route_unit:'||a.id::text)
  on conflict(organization_id,user_id,activity_key) do update set completed=excluded.completed,score=excluded.score,observed_at=now();
 end if;
 return new_id;
end $$;

create function public.assign_training_reinforcement(p_org uuid,p_actor uuid,p_user uuid,p_activities bigint[],p_due timestamptz,p_before jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare a public.learning_activity_catalog; aid bigint;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join codezero_private.organization_access v on v.organization_id=m.organization_id and v.viewer_id=p_actor and v.target_id=p_user where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN';end if;
 if p_activities is null or cardinality(p_activities) not between 1 and 3 or p_due is null or p_due<=now() or p_before is null or jsonb_typeof(p_before)<>'object' then raise exception 'INVALID_REINFORCEMENT';end if;
 foreach aid in array p_activities loop
  select * into a from public.learning_activity_catalog where id=aid and active and kind='deliverable';
  if not found then raise exception 'INVALID_ACTIVITY';end if;
  insert into public.learning_assignments(organization_id,user_id,activity_key,activity_type,activity_id,title,competency,due_at,reinforcement_before,assigned_by)
  values(p_org,p_user,'route_unit:'||a.id::text,'route_unit',a.id,a.title,a.competencies[1],p_due,p_before,p_actor)
  on conflict(organization_id,user_id,activity_key) do update set due_at=excluded.due_at,reinforcement_before=excluded.reinforcement_before,reinforcement_after=null,assigned_by=excluded.assigned_by;
 end loop;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'training_reinforcement_assigned',jsonb_build_object('activities',p_activities,'due_at',p_due,'before',p_before));
end $$;

create function public.set_training_position(p_actor uuid,p_user uuid,p_org uuid,p_position text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.learning_job_profiles where position_key=p_position) then raise exception 'FORBIDDEN';end if;
 if p_org is null then
  if p_actor<>p_user then raise exception 'FORBIDDEN';end if;
  update public.profiles set learning_position_key=p_position where id=p_user;
 else
  if p_actor<>p_user and not exists(select 1 from public.organization_memberships m join codezero_private.organization_access v on v.organization_id=m.organization_id and v.viewer_id=p_actor and v.target_id=p_user where m.organization_id=p_org and m.user_id=p_actor and m.active and m.role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN';end if;
  update public.organization_memberships set learning_position_key=p_position where organization_id=p_org and user_id=p_user and active;
  if not found then raise exception 'FORBIDDEN';end if;
 end if;
end $$;

create function public.save_training_job_profile(p_actor uuid,p_position text,p_weights jsonb,p_expected jsonb,p_version integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare next_version integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role='owner') then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_position,0));
 select max(version)+1 into next_version from public.learning_job_profiles where position_key=p_position;
 if next_version is null or next_version<>p_version+1 then raise exception 'PROFILE_CONFLICT';end if;
 if jsonb_typeof(p_weights)<>'object' or jsonb_typeof(p_expected)<>'object' or (select count(*) from jsonb_each(p_weights))<>10 or (select count(*) from jsonb_each(p_expected))<>10 or exists(select 1 from jsonb_each(p_weights) e where not e.key=any(array['communication','diagnosis','data','prioritization','documentation','deescalation','negotiation','planning','technical','collaboration']) or e.value#>>'{}' not in ('high','medium','low')) or exists(select 1 from jsonb_each(p_expected) e where not p_weights?e.key or e.value::text !~ '^[0-4]$') then raise exception 'INVALID_PROFILE';end if;
 insert into public.learning_job_profiles(position_key,version,weights,expected,created_by) values(p_position,next_version,p_weights,p_expected,p_actor);
 return next_version;
end $$;

create function public.complete_training_reinforcement(p_actor uuid,p_org uuid,p_user uuid,p_activity bigint,p_after jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not (
 exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) or
 exists(select 1 from public.organization_memberships m join codezero_private.organization_access a on a.organization_id=m.organization_id and a.viewer_id=p_actor and a.target_id=p_user where m.organization_id=p_org and m.user_id=p_actor and m.active and m.role in ('owner','admin','manager','supervisor'))
 ) then raise exception 'FORBIDDEN';end if;
 if p_after is null or jsonb_typeof(p_after)<>'object' then raise exception 'INVALID_SNAPSHOT';end if;
 update public.learning_assignments set reinforcement_after=p_after where organization_id=p_org and user_id=p_user and activity_key='route_unit:'||p_activity::text and reinforcement_before is not null;
 if found then insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'training_reinforcement_reviewed',jsonb_build_object('activity_id',p_activity,'after',p_after));end if;
end $$;
revoke all on function public.training_valid_scores(jsonb,text[]),public.submit_training_practice(uuid,bigint,uuid,uuid,text,jsonb,text,jsonb,jsonb,uuid),public.review_training_practice(uuid,uuid,jsonb,text,text[],uuid,text),public.assign_training_reinforcement(uuid,uuid,uuid,bigint[],timestamptz,jsonb),public.set_training_position(uuid,uuid,uuid,text),public.save_training_job_profile(uuid,text,jsonb,jsonb,integer),public.complete_training_reinforcement(uuid,uuid,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.training_valid_scores(jsonb,text[]),public.submit_training_practice(uuid,bigint,uuid,uuid,text,jsonb,text,jsonb,jsonb,uuid),public.review_training_practice(uuid,uuid,jsonb,text,text[],uuid,text),public.assign_training_reinforcement(uuid,uuid,uuid,bigint[],timestamptz,jsonb),public.set_training_position(uuid,uuid,uuid,text),public.save_training_job_profile(uuid,text,jsonb,jsonb,integer),public.complete_training_reinforcement(uuid,uuid,uuid,bigint,jsonb) to service_role;


-- Source: 20261008033010_role_training_included_diploma.sql
-- Sandbox only. Reuse the existing certificate store; do not modify previous certificates.
create function public.issue_training_route_diploma(p_user uuid,p_org uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare profile public.learning_job_profiles; competency text; recognized integer; independent boolean; cap uuid; result uuid;
begin
 if not exists(select 1 from public.profiles where id=p_user and status='active' and (role in ('owner','admin') or plan_name in ('pro','enterprise'))) then raise exception 'FORBIDDEN';end if;
 if p_org is not null and not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=p_org and m.user_id=p_user and m.active and o.active) then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':cs-v2',0));
 select * into profile from public.learning_job_profiles where position_key='customer_success' order by version desc limit 1;
 if not found then raise exception 'MISSING_PROFILE';end if;
 select h.id into cap from public.learning_evidence_history h where h.user_id=p_user and h.organization_id is not distinct from p_org and h.activity_key='cs-capstone-faro' and h.review_source='admin' order by h.observed_at desc,h.id desc limit 1;
 if cap is null or not exists(select 1 from public.learning_evidence_history h where h.id=cap and h.assistance='independent' and cardinality(h.critical_errors)=0 and not exists(select 1 from jsonb_each(h.competency_scores) x where (x.value::text)::integer<3)) then raise exception 'CAPSTONE_REQUIRED';end if;
 for competency in select key from jsonb_each_text(profile.weights) where value='high' loop
  with latest as (
   select distinct on(h.independent_key) h.* from public.learning_evidence_history h
   where h.user_id=p_user and h.organization_id is not distinct from p_org and h.competency_scores?competency
   order by h.independent_key,(h.review_source in ('manager','admin')) desc,h.observed_at desc,h.id desc
  ) select count(*) filter(where cardinality(critical_errors)=0 and (competency_scores->>competency)::integer>=1),
   coalesce(bool_or(cardinality(critical_errors)=0 and review_source in ('manager','admin') and assistance='independent' and kind<>'exercise' and (competency_scores->>competency)::integer>=3),false)
   into recognized,independent from latest;
  if recognized<3 or not independent then raise exception 'COMPETENCY_NOT_DEMONSTRATED';end if;
 end loop;
 insert into public.certificates(user_id,certificate_type,title,metadata) values(p_user,'customer-success-v2','Garciloga · Customer Success: práctica de Cuenta Faro',jsonb_build_object('route_version','role-practice-v1','estimated_hours',165,'profile_version',profile.version,'capstone_evidence_id',cap,'scope','simulated_practice','included_in_plan',true)) on conflict(user_id,certificate_type) do nothing;
 select id into result from public.certificates where user_id=p_user and certificate_type='customer-success-v2';return result;
end $$;
revoke all on function public.issue_training_route_diploma(uuid,uuid) from public,anon,authenticated;
grant execute on function public.issue_training_route_diploma(uuid,uuid) to service_role;


-- Source: 20261008033350_role_training_review_foreign_key_index.sql
create index learning_history_submission_user_idx on public.learning_evidence_history(submission_id,user_id);


-- Source: 20261008042551_project_approval_workflows.sql
-- Sandbox only. Extend existing project grading; capstones stay Admin-only.
create table public.learning_project_review_flows(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 flow_key uuid not null default gen_random_uuid(), version integer not null check(version>0),
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 name text not null check(length(name) between 3 and 120), enabled boolean not null,
 priority integer not null check(priority between 1 and 1000), audience jsonb not null, stages jsonb not null,
 unique(organization_id,flow_key,version)
);
create index project_flow_author_idx on public.learning_project_review_flows(created_by);
create table public.learning_project_review_runs(
 submission_id uuid primary key references public.learning_practice_submissions(id) on delete cascade,
 organization_id uuid not null references public.organizations(id), learner_id uuid not null references public.profiles(id),
 flow_id uuid not null references public.learning_project_review_flows(id), authorizer_id uuid not null references public.profiles(id),
 snapshot jsonb not null, current_stage integer not null default 0,
 state text not null default 'pending' check(state in ('pending','changes_requested','approved')),
 progress jsonb not null default '{}', final_evidence_id uuid references public.learning_evidence_history(id),
 created_at timestamptz not null default now()
);
create index project_run_org_idx on public.learning_project_review_runs(organization_id,learner_id);
create index project_run_flow_idx on public.learning_project_review_runs(flow_id);
create index project_run_authorizer_idx on public.learning_project_review_runs(authorizer_id);
create index project_run_learner_idx on public.learning_project_review_runs(learner_id);
create index project_run_final_idx on public.learning_project_review_runs(final_evidence_id);
create table public.learning_project_review_participants(
 submission_id uuid not null references public.learning_project_review_runs(submission_id) on delete cascade,
 stage_index integer not null, user_id uuid not null references public.profiles(id),
 organization_id uuid not null references public.organizations(id), learner_id uuid not null references public.profiles(id),
 authorizer_id uuid not null references public.profiles(id),
 primary key(submission_id,stage_index,user_id)
);
create index project_participant_user_idx on public.learning_project_review_participants(user_id,submission_id);
create index project_participant_org_idx on public.learning_project_review_participants(organization_id);
create index project_participant_learner_idx on public.learning_project_review_participants(learner_id);
create index project_participant_author_idx on public.learning_project_review_participants(authorizer_id);
create table public.learning_project_review_votes(
 id uuid primary key default gen_random_uuid(), submission_id uuid not null,
 stage_index integer not null, user_id uuid not null, organization_id uuid not null references public.organizations(id),
 learner_id uuid not null references public.profiles(id), competency_scores jsonb not null,
 assistance text not null check(assistance in ('guided','independent')),
 decision text not null check(decision in ('approve','request_changes')), critical_errors text[] not null,
 feedback text not null check(length(feedback) between 40 and 6000), observed_at timestamptz not null default now(),
 foreign key(submission_id,stage_index,user_id) references public.learning_project_review_participants(submission_id,stage_index,user_id)
);
create index project_vote_participant_idx on public.learning_project_review_votes(submission_id,stage_index,user_id,observed_at desc);
create index project_vote_user_idx on public.learning_project_review_votes(user_id);
create index project_vote_org_idx on public.learning_project_review_votes(organization_id,learner_id);
create index project_vote_learner_idx on public.learning_project_review_votes(learner_id);
alter table public.learning_evidence_history add column approval_submission_id uuid references public.learning_project_review_runs(submission_id);
create index learning_history_approval_idx on public.learning_evidence_history(approval_submission_id);

alter table public.learning_project_review_flows enable row level security;
alter table public.learning_project_review_runs enable row level security;
alter table public.learning_project_review_participants enable row level security;
alter table public.learning_project_review_votes enable row level security;
revoke all on public.learning_project_review_flows,public.learning_project_review_runs,public.learning_project_review_participants,public.learning_project_review_votes from public,anon,authenticated;
grant select on public.learning_project_review_flows,public.learning_project_review_runs,public.learning_project_review_participants,public.learning_project_review_votes to authenticated;
grant all on public.learning_project_review_flows,public.learning_project_review_runs,public.learning_project_review_participants,public.learning_project_review_votes to service_role;
create policy project_flow_read on public.learning_project_review_flows for select to authenticated using(
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active') and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_flows.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid()))
);
-- Delegated reviewers can read only the named project, never the rest of the learner's history.
create policy project_participant_read on public.learning_project_review_participants for select to authenticated using(
 (user_id=(select auth.uid()) or learner_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=learning_project_review_participants.learner_id))
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid()))
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active')
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=learning_project_review_participants.authorizer_id and a.target_id=learning_project_review_participants.learner_id)
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=learning_project_review_participants.authorizer_id and a.target_id=learning_project_review_participants.user_id)
);
create policy project_run_read on public.learning_project_review_runs for select to authenticated using(
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active') and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_runs.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid())) and (learner_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_runs.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=learning_project_review_runs.learner_id)
 or exists(select 1 from public.learning_project_review_participants p where p.submission_id=learning_project_review_runs.submission_id and p.user_id=(select auth.uid())))
);
create policy project_vote_read on public.learning_project_review_votes for select to authenticated using(
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active') and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_votes.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid())) and (user_id=(select auth.uid()) or learner_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_votes.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=learning_project_review_votes.learner_id))
);
create policy project_delegated_submission_read on public.learning_practice_submissions for select to authenticated using(
 exists(select 1 from public.learning_project_review_participants p where p.submission_id=learning_practice_submissions.id and p.user_id=(select auth.uid()))
);

create function public.project_selector_valid(p_selector jsonb) returns boolean language plpgsql immutable security invoker set search_path='' as $$
begin
 if p_selector is null or jsonb_typeof(p_selector)<>'object' or not (p_selector ?& array['all','roles','positions','users']) or (select count(*) from jsonb_object_keys(p_selector))<>4 then return false;end if;
 if jsonb_typeof(p_selector->'all')<>'boolean' or jsonb_typeof(p_selector->'roles')<>'array' or jsonb_typeof(p_selector->'positions')<>'array' or jsonb_typeof(p_selector->'users')<>'array' then return false;end if;
 if jsonb_array_length(p_selector->'users')>100 or jsonb_array_length(p_selector->'positions')>16 or jsonb_array_length(p_selector->'roles')>5 then return false;end if;
 if exists(select 1 from jsonb_array_elements((p_selector->'roles')||(p_selector->'positions')||(p_selector->'users')) v where jsonb_typeof(v)<>'string') then return false;end if;
 if exists(select 1 from jsonb_array_elements_text(p_selector->'roles') r where r not in ('owner','admin','manager','supervisor','learner')) then return false;end if;
 if exists(select 1 from jsonb_array_elements_text(p_selector->'users') u where u !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then return false;end if;
 return (p_selector->>'all')::boolean or jsonb_array_length(p_selector->'roles')+jsonb_array_length(p_selector->'positions')+jsonb_array_length(p_selector->'users')>0;
end $$;
create function public.project_selector_matches(p_selector jsonb,p_user uuid,p_role text,p_position text) returns boolean language sql immutable security invoker set search_path='' as $$
 select coalesce((p_selector->>'all')::boolean,false) or coalesce(p_selector->'roles'?p_role,false) or coalesce(p_selector->'positions'?p_position,false) or p_selector->'users'?p_user::text;
$$;
create function public.save_project_review_flow(p_actor uuid,p_org uuid,p_key uuid,p_version integer,p_name text,p_enabled boolean,p_priority integer,p_audience jsonb,p_stages jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare next_version integer; step jsonb; selectors jsonb; user_text text; key_id uuid:=coalesce(p_key,gen_random_uuid()); result uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN';end if;
 if p_name is null or length(trim(p_name)) not between 3 and 120 or p_enabled is null or p_priority is null or p_priority not between 1 and 1000 or not public.project_selector_valid(p_audience) or p_stages is null or jsonb_typeof(p_stages)<>'array' or jsonb_array_length(p_stages) not between 1 and 8 then raise exception 'INVALID_FLOW';end if;
 for step in select value from jsonb_array_elements(p_stages) loop
  if jsonb_typeof(step)<>'object' or not (step ?& array['name','required','reviewers']) or (select count(*) from jsonb_object_keys(step))<>3 or jsonb_typeof(step->'name')<>'string' or length(trim(step->>'name')) not between 1 and 120 or jsonb_typeof(step->'required')<>'number' or step->>'required' !~ '^[1-9][0-9]?$' or (step->>'required')::integer>20 or not public.project_selector_valid(step->'reviewers') then raise exception 'INVALID_STAGE';end if;
 end loop;
 for selectors in select p_audience union all select value->'reviewers' from jsonb_array_elements(p_stages) loop
  if exists(select 1 from jsonb_array_elements_text(selectors->'positions') k where not exists(select 1 from public.learning_job_profiles j where j.position_key=k)) then raise exception 'UNKNOWN_POSITION';end if;
  for user_text in select value from jsonb_array_elements_text(selectors->'users') loop
   if not exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id join codezero_private.organization_access a on a.organization_id=m.organization_id and a.viewer_id=p_actor and a.target_id=m.user_id where m.organization_id=p_org and m.user_id=user_text::uuid and m.active and p.status='active') then raise exception 'USER_OUT_OF_SCOPE';end if;
  end loop;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended(p_org::text||key_id::text,0));
 select coalesce(max(version),0)+1 into next_version from public.learning_project_review_flows where organization_id=p_org and flow_key=key_id;
 if coalesce(p_version,-1)<>next_version-1 then raise exception 'FLOW_VERSION_CONFLICT';end if;
 if next_version>1 and not exists(select 1 from public.learning_project_review_flows f where f.organization_id=p_org and f.flow_key=key_id and (f.created_by=p_actor or exists(select 1 from public.organization_memberships m where m.organization_id=p_org and m.user_id=p_actor and m.active and m.role in ('owner','admin')))) then raise exception 'FLOW_OUT_OF_SCOPE';end if;
 insert into public.learning_project_review_flows(organization_id,flow_key,version,created_by,name,enabled,priority,audience,stages)
 values(p_org,key_id,next_version,p_actor,trim(p_name),p_enabled,p_priority,p_audience,p_stages) returning id into result;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'project_flow_version_saved',jsonb_build_object('flow_id',result,'flow_key',key_id,'version',next_version,'enabled',p_enabled));
 return result;
end $$;

create function public.ensure_project_review_run(p_submission uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.learning_practice_submissions; f public.learning_project_review_flows; candidate public.learning_project_review_flows; m public.organization_memberships;
 priority_found integer; matches integer:=0; snapshot jsonb:='[]'; step jsonb; index_no integer:=0; people jsonb; count_people integer;
begin
 select * into s from public.learning_practice_submissions where id=p_submission for update;
 if not found then raise exception 'UNKNOWN_SUBMISSION';end if;
 if exists(select 1 from public.learning_project_review_runs where submission_id=s.id) then return s.id;end if;
 if s.organization_id is null or not exists(select 1 from public.learning_activity_catalog where id=s.activity_id and kind='project') then return null;end if;
 select * into m from public.organization_memberships where organization_id=s.organization_id and user_id=s.user_id and active;
 if not found then raise exception 'FORBIDDEN';end if;
 for candidate in with latest as(select distinct on(flow_key) * from public.learning_project_review_flows where organization_id=s.organization_id order by flow_key,version desc)
 select * from latest l where l.enabled and public.project_selector_matches(l.audience,s.user_id,m.role,m.learning_position_key)
 and exists(select 1 from public.organization_memberships c join public.profiles p on p.id=c.user_id join codezero_private.organization_access a on a.organization_id=c.organization_id and a.viewer_id=c.user_id and a.target_id=s.user_id where c.organization_id=s.organization_id and c.user_id=l.created_by and c.active and c.role in ('owner','admin','manager','supervisor') and p.status='active') order by priority,id loop
  if priority_found is null then f:=candidate;priority_found:=candidate.priority;end if;
  if candidate.priority=priority_found then matches:=matches+1;end if;
 end loop;
 if matches=0 then return null;end if;
 if matches>1 then raise exception 'FLOW_PRIORITY_CONFLICT';end if;
 for step in select value from jsonb_array_elements(f.stages) loop
  select coalesce(jsonb_agg(jsonb_build_object('id',c.user_id,'name',c.display_name,'role',c.role) order by c.display_name,c.user_id),'[]'),count(*)
  into people,count_people from public.organization_memberships c join public.profiles p on p.id=c.user_id join codezero_private.organization_access a on a.organization_id=c.organization_id and a.viewer_id=f.created_by and a.target_id=c.user_id
  where c.organization_id=s.organization_id and c.active and p.status='active' and c.user_id<>s.user_id and public.project_selector_matches(step->'reviewers',c.user_id,c.role,c.learning_position_key);
  if count_people<(step->>'required')::integer then raise exception 'INSUFFICIENT_REVIEWERS';end if;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('name',step->>'name','required',(step->>'required')::integer,'reviewers',people));
 end loop;
 insert into public.learning_project_review_runs(submission_id,organization_id,learner_id,flow_id,authorizer_id,snapshot) values(s.id,s.organization_id,s.user_id,f.id,f.created_by,snapshot);
 for step in select value from jsonb_array_elements(snapshot) loop
  insert into public.learning_project_review_participants(submission_id,stage_index,user_id,organization_id,learner_id,authorizer_id)
  select s.id,index_no,(r->>'id')::uuid,s.organization_id,s.user_id,f.created_by from jsonb_array_elements(step->'reviewers') r;
  index_no:=index_no+1;
 end loop;
 return s.id;
end $$;
create function public.project_review_submission_trigger() returns trigger language plpgsql security invoker set search_path='' as $$
begin perform public.ensure_project_review_run(new.id);return new;end $$;
create trigger project_review_submission after insert on public.learning_practice_submissions for each row execute function public.project_review_submission_trigger();

-- Reuse direct review for deliverables/capstones and projects without an optional flow.
alter function public.review_training_practice(uuid,uuid,jsonb,text,text[],uuid,text) rename to review_training_practice_direct;
create or replace function public.review_training_practice_direct(p_actor uuid,p_submission uuid,p_scores jsonb,p_feedback text,p_errors text[],p_expected uuid default null,p_assistance text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.learning_practice_submissions; a public.learning_activity_catalog; latest uuid; reviewer text; new_id uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN';end if;
 select * into s from public.learning_practice_submissions where id=p_submission for update;
 if not found then raise exception 'UNKNOWN_SUBMISSION';end if;
 select * into a from public.learning_activity_catalog where id=s.activity_id;
 if s.user_id=p_actor then raise exception 'SELF_REVIEW_FORBIDDEN';end if;
 if exists(select 1 from public.learning_project_review_runs where submission_id=s.id) then raise exception 'FLOW_REVIEW_REQUIRED';end if;
 if a.kind='exercise' then raise exception 'INVALID_REVIEW';end if;
 if exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then reviewer='admin';
 elsif a.kind in ('deliverable','project') and p_actor<>s.user_id and exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join codezero_private.organization_access v on v.organization_id=m.organization_id and v.viewer_id=p_actor and v.target_id=s.user_id where m.organization_id=s.organization_id and m.user_id=p_actor and m.active and o.active and m.role in ('owner','admin','manager','supervisor')) then reviewer='manager';
 else raise exception 'FORBIDDEN';end if;
 if not public.training_valid_scores(p_scores,a.competencies) or p_feedback is null or length(trim(p_feedback))<40 or length(p_feedback)>6000 or p_errors is null or not p_errors<@array['data_exposure','unauthorized_change','invented_commitment','unverified_closure']::text[] or (p_assistance is not null and p_assistance not in ('guided','independent')) then raise exception 'INVALID_REVIEW';end if;
 select id into latest from public.learning_evidence_history where submission_id=p_submission and review_source in ('manager','admin') order by observed_at desc,id desc limit 1;
 if latest is distinct from p_expected then raise exception 'REVIEW_CONFLICT';end if;
 insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by,reevaluation_of,critical_errors,feedback)
 values(s.id,s.user_id,s.organization_id,a.content_key,a.content_key,a.kind,p_scores,coalesce(p_assistance,s.assistance),reviewer,p_actor,s.reevaluation_of,p_errors,p_feedback) returning id into new_id;
 if s.organization_id is not null then
  insert into public.learning_evidence(organization_id,user_id,activity_key,completed,score)
  select s.organization_id,s.user_id,'route_unit:'||a.id::text,cardinality(p_errors)=0 and not exists(select 1 from jsonb_each(p_scores) x where (x.value::text)::integer<3),
   (select round(avg((x.value::text)::numeric)*25)::integer from jsonb_each(p_scores) x)
  where exists(select 1 from public.learning_assignments where organization_id=s.organization_id and user_id=s.user_id and activity_key='route_unit:'||a.id::text)
  on conflict(organization_id,user_id,activity_key) do update set completed=excluded.completed,score=excluded.score,observed_at=now();
 end if;
 return new_id;
end $$;

create function public.review_training_practice(p_actor uuid,p_submission uuid,p_scores jsonb,p_feedback text,p_errors text[],p_expected uuid default null,p_assistance text default null,p_stage integer default null,p_decision text default 'approve')
returns uuid language plpgsql security invoker set search_path='' as $$
declare run public.learning_project_review_runs; s public.learning_practice_submissions; a public.learning_activity_catalog;
 latest uuid; vote_id uuid; evidence_id uuid; approvals integer; objections integer; scores jsonb; independent boolean; combined_feedback text;
begin
 if p_actor is null or not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN';end if;
 select * into s from public.learning_practice_submissions where id=p_submission for update;
 if not found or s.user_id=p_actor then raise exception 'SELF_REVIEW_FORBIDDEN';end if;
 select * into a from public.learning_activity_catalog where id=s.activity_id;
 select * into run from public.learning_project_review_runs where submission_id=s.id for update;
 if not found then
  if p_stage is not null then raise exception 'FLOW_NOT_FOUND';end if;
  return public.review_training_practice_direct(p_actor,p_submission,p_scores,p_feedback,p_errors,p_expected,p_assistance);
 end if;
 if run.state='approved' or p_stage is distinct from run.current_stage then raise exception 'STAGE_CONFLICT';end if;
 if not exists(select 1 from public.learning_project_review_participants r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.user_id join public.profiles p on p.id=m.user_id join public.organizations o on o.id=m.organization_id where r.submission_id=s.id and r.stage_index=run.current_stage and r.user_id=p_actor and m.active and p.status='active' and o.active)
 or not exists(select 1 from public.organization_memberships c join public.profiles p on p.id=c.user_id join codezero_private.organization_access x on x.organization_id=c.organization_id and x.viewer_id=c.user_id and x.target_id=s.user_id join codezero_private.organization_access y on y.organization_id=c.organization_id and y.viewer_id=c.user_id and y.target_id=p_actor where c.organization_id=s.organization_id and c.user_id=run.authorizer_id and c.active and c.role in ('owner','admin','manager','supervisor') and p.status='active') then raise exception 'FORBIDDEN';end if;
 if not exists(select 1 from public.organization_memberships where organization_id=s.organization_id and user_id=s.user_id and active) then raise exception 'FORBIDDEN';end if;
 if not public.training_valid_scores(p_scores,a.competencies) or p_feedback is null or length(trim(p_feedback)) not between 40 and 6000 or p_errors is null or not p_errors<@array['data_exposure','unauthorized_change','invented_commitment','unverified_closure']::text[] or p_assistance is null or p_assistance not in ('guided','independent') or p_decision is null or p_decision not in ('approve','request_changes') then raise exception 'INVALID_REVIEW';end if;
 if p_decision='approve' and (cardinality(p_errors)>0 or exists(select 1 from jsonb_each(p_scores) q where (q.value::text)::integer<3)) then raise exception 'APPROVAL_REQUIRES_PASSING_RUBRIC';end if;
 select id into latest from public.learning_project_review_votes where submission_id=s.id and stage_index=run.current_stage and user_id=p_actor order by observed_at desc,id desc limit 1;
 if latest is distinct from p_expected then raise exception 'REVIEW_CONFLICT';end if;
 insert into public.learning_project_review_votes(submission_id,stage_index,user_id,organization_id,learner_id,competency_scores,assistance,decision,critical_errors,feedback)
 values(s.id,run.current_stage,p_actor,s.organization_id,s.user_id,p_scores,p_assistance,p_decision,p_errors,p_feedback) returning id into vote_id;
 with latest_votes as(select distinct on(user_id) * from public.learning_project_review_votes where submission_id=s.id and stage_index=run.current_stage order by user_id,observed_at desc,id desc)
 select count(*) filter(where decision='approve'),count(*) filter(where decision='request_changes') into approvals,objections from latest_votes;
 update public.learning_project_review_runs set progress=jsonb_set(progress,array[run.current_stage::text],jsonb_build_object('approved',approvals,'changes_requested',objections)),state=case when objections>0 then 'changes_requested' else 'pending' end where submission_id=s.id;
 if approvals<(run.snapshot->run.current_stage->>'required')::integer or objections>0 then return vote_id;end if;
 if run.current_stage<jsonb_array_length(run.snapshot)-1 then
  update public.learning_project_review_runs set current_stage=current_stage+1,state='pending' where submission_id=s.id;return vote_id;
 end if;
 -- Only final consensus becomes competency evidence. No provisional vote can grant a level or diploma.
 with latest_votes as(select distinct on(stage_index,user_id) * from public.learning_project_review_votes where submission_id=s.id order by stage_index,user_id,observed_at desc,id desc),
 grouped as(select q.key,min((q.value::text)::integer) score from latest_votes v cross join lateral jsonb_each(v.competency_scores) q where v.decision='approve' group by q.key)
 select jsonb_object_agg(key,score) into scores from grouped;
 with latest_votes as(select distinct on(stage_index,user_id) * from public.learning_project_review_votes where submission_id=s.id order by stage_index,user_id,observed_at desc,id desc)
 select bool_and(assistance='independent'),left(string_agg('Paso '||(stage_index+1)::text||' · revisor '||user_id::text||': '||feedback,E'\n' order by stage_index,user_id),6000) into independent,combined_feedback from latest_votes where decision='approve';
 insert into public.learning_evidence_history(submission_id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,reviewed_by,critical_errors,feedback,approval_submission_id)
 values(s.id,s.user_id,s.organization_id,a.content_key,a.content_key,'project',scores,case when independent then 'independent' else 'guided' end,'manager',p_actor,'{}',combined_feedback,s.id) returning id into evidence_id;
 update public.learning_project_review_runs set state='approved',final_evidence_id=evidence_id where submission_id=s.id;
 insert into public.learning_evidence(organization_id,user_id,activity_key,completed,score)
 select s.organization_id,s.user_id,'route_unit:'||a.id::text,true,(select round(avg((q.value::text)::numeric)*25)::integer from jsonb_each(scores) q)
 where exists(select 1 from public.learning_assignments where organization_id=s.organization_id and user_id=s.user_id and activity_key='route_unit:'||a.id::text)
 on conflict(organization_id,user_id,activity_key) do update set completed=true,score=excluded.score,observed_at=now();
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(s.organization_id,p_actor,s.user_id,'project_flow_completed',jsonb_build_object('submission_id',s.id,'flow_id',run.flow_id,'evidence_id',evidence_id));
 return evidence_id;
end $$;
-- The direct helper cannot be a bypass for configured flows, even from another trusted API.
-- All public writes remain available to service_role only; actor validation stays inside RPCs.
revoke all on function public.project_selector_valid(jsonb),public.project_selector_matches(jsonb,uuid,text,text),public.save_project_review_flow(uuid,uuid,uuid,integer,text,boolean,integer,jsonb,jsonb),public.ensure_project_review_run(uuid),public.project_review_submission_trigger(),public.review_training_practice(uuid,uuid,jsonb,text,text[],uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.project_selector_valid(jsonb),public.project_selector_matches(jsonb,uuid,text,text),public.save_project_review_flow(uuid,uuid,uuid,integer,text,boolean,integer,jsonb,jsonb),public.ensure_project_review_run(uuid),public.project_review_submission_trigger(),public.review_training_practice(uuid,uuid,jsonb,text,text[],uuid,text,integer,text) to service_role;


-- Source: 20261008042816_project_review_delegation_scope.sql
-- Materialize the current delegation scope without exposing another viewer's private access rows.
-- Invoker triggers execute within the existing trusted organization-access rebuild transaction.
alter table public.learning_project_review_participants add column scope_authorized boolean not null default true;
create function codezero_private.refresh_project_review_delegation() returns trigger language plpgsql security invoker set search_path='' as $$
declare org uuid:=coalesce(new.organization_id,old.organization_id); viewer uuid:=coalesce(new.viewer_id,old.viewer_id); target uuid:=coalesce(new.target_id,old.target_id);
begin
 update public.learning_project_review_participants r set scope_authorized=(
 exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.learner_id)
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.user_id)
 and exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=r.organization_id and m.user_id=r.authorizer_id and m.active and m.role in ('owner','admin','manager','supervisor') and p.status='active')
 ) where r.organization_id=org and r.authorizer_id=viewer and target in(r.user_id,r.learner_id);
 return null;
end $$;
revoke all on function codezero_private.refresh_project_review_delegation() from public,anon,authenticated;
grant execute on function codezero_private.refresh_project_review_delegation() to service_role;
create trigger refresh_project_review_delegation after insert or delete or update on codezero_private.organization_access for each row execute function codezero_private.refresh_project_review_delegation();
drop policy project_participant_read on public.learning_project_review_participants;
create policy project_participant_read on public.learning_project_review_participants for select to authenticated using(
 scope_authorized and (user_id=(select auth.uid()) or learner_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=learning_project_review_participants.learner_id))
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid()))
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active')
);
create function codezero_private.refresh_project_authorizer() returns trigger language plpgsql security invoker set search_path='' as $$
declare person uuid; org uuid;
begin
 if tg_table_name='profiles' then person:=coalesce(new.id,old.id);else person:=coalesce(new.user_id,old.user_id);org:=coalesce(new.organization_id,old.organization_id);end if;
 update public.learning_project_review_participants r set scope_authorized=(
 exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.learner_id)
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.user_id)
 and exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=r.organization_id and m.user_id=r.authorizer_id and m.active and m.role in ('owner','admin','manager','supervisor') and p.status='active')
 ) where r.authorizer_id=person and (org is null or r.organization_id=org);
 return null;
end $$;
revoke all on function codezero_private.refresh_project_authorizer() from public,anon,authenticated;
grant execute on function codezero_private.refresh_project_authorizer() to service_role;
create trigger refresh_project_authorizer_status after update of status on public.profiles for each row execute function codezero_private.refresh_project_authorizer();
create trigger refresh_project_authorizer_membership after update of active,role on public.organization_memberships for each row execute function codezero_private.refresh_project_authorizer();


-- Idempotent curriculum bootstrap; no learners, submissions, votes or configured flows are seeded.
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-communication','common','Comunicación clara y compromisos','deliverable',array['communication','documentation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-diagnosis','common','Descubrimiento y diagnóstico','deliverable',array['diagnosis','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-data','common','Métricas, denominadores y calidad','deliverable',array['data','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-priority','common','Priorización y capacidad sostenible','deliverable',array['prioritization','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-documentation','common','Documentación y sistemas de trabajo','deliverable',array['documentation','collaboration']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-deescalation','common','Objeciones y desescalamiento','deliverable',array['deescalation','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-commercial','common','Negociación y criterio comercial','deliverable',array['negotiation','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-planning','common','Planeación, riesgos y seguimiento','deliverable',array['planning','prioritization']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('common-technical','common','Producto, datos, APIs y traspasos','deliverable',array['technical','collaboration','documentation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-portfolio','customer_success','Cartera y ciclo de vida','deliverable',array['prioritization','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-stakeholders','customer_success','Stakeholders y autoridad','deliverable',array['communication','collaboration']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-handoff','customer_success','Handoff y alcance confirmado','deliverable',array['documentation','collaboration','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-success-plan','customer_success','Plan de éxito y primer valor','deliverable',array['diagnosis','data','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-kickoff','customer_success','Kickoff y gobierno de cuenta','deliverable',array['communication','planning','collaboration']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-adoption','customer_success','Adopción y barreras','deliverable',array['data','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-health','customer_success','Health score explicable','deliverable',array['data','diagnosis','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-training','customer_success','Capacitación y transferencia','deliverable',array['communication','technical','data']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-qbr','customer_success','QBR y decisiones trimestrales','deliverable',array['communication','data','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-integration','customer_success','Colaboración técnica y primer valor','deliverable',array['technical','collaboration','documentation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-churn','customer_success','Churn y rescate de cuenta','deliverable',array['diagnosis','deescalation','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-renewal','customer_success','Renovación y proceso de compra','deliverable',array['negotiation','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-expansion','customer_success','Expansión por necesidad y encaje','deliverable',array['negotiation','diagnosis','technical']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-roi','customer_success','ROI y valor verificable','deliverable',array['data','diagnosis','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-forecast','customer_success','Forecast y escenarios de continuidad','deliverable',array['planning','data','negotiation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-voc','customer_success','Voz del cliente y cierre del ciclo','deliverable',array['documentation','collaboration','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-surveys','customer_success','NPS, CSAT y escucha responsable','deliverable',array['data','communication','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-segmentation','customer_success','Segmentación y diseño de cobertura','deliverable',array['data','prioritization','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-case-study','customer_success','Casos de éxito con evidencia y permiso','deliverable',array['communication','documentation','data']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-ebr','customer_success','EBR y criterio ejecutivo','deliverable',array['communication','planning','negotiation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-handoff','customer_success','Cuenta Faro · 1 · Traspaso comercial','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-success_plan','customer_success','Cuenta Faro · 2 · Plan de éxito','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-onboarding','customer_success','Cuenta Faro · 3 · Onboarding y primer valor','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-adoption','customer_success','Cuenta Faro · 4 · Adopción y resultados','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-risk','customer_success','Cuenta Faro · 5 · Riesgo y escalación','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-business_review','customer_success','Cuenta Faro · 6 · Revisión de resultados','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-renewal','customer_success','Cuenta Faro · 7 · Renovación y expansión','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-episode-voice_customer','customer_success','Cuenta Faro · 8 · Voz del cliente y cierre del ciclo','deliverable',array['diagnosis','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-roleplay-1','customer_success','Role-play escrito · Sponsor nuevo y objetivo por confirmar','deliverable',array['communication','deescalation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-roleplay-2','customer_success','Role-play escrito · Usuario bloqueado y capacitación','deliverable',array['communication','deescalation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-roleplay-3','customer_success','Role-play escrito · Objeción de valor en renovación','deliverable',array['communication','deescalation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-roleplay-4','customer_success','Role-play escrito · Decisión ejecutiva y límites de evidencia','deliverable',array['communication','deescalation']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-project-adoption','customer_success','Proyecto · plan de adopción y health score','project',array['data','diagnosis','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-project-continuity','customer_success','Proyecto · continuidad, renovación y valor','project',array['negotiation','planning','data']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-project-voice','customer_success','Proyecto · voz del cliente y cobertura','project',array['collaboration','documentation','data']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-capstone-faro','customer_success','Capstone · Cuenta Faro completa y EBR','capstone',array['communication','diagnosis','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-exam-1','customer_success','Examen · Fundamentos','exercise',array['prioritization','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-exam-2','customer_success','Examen · Operación','exercise',array['data','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-exam-3','customer_success','Examen · Dominio','exercise',array['diagnosis','deescalation','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-exam-4','customer_success','Examen · Especialista','exercise',array['documentation','collaboration','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-reevaluation-1','customer_success','Reevaluación a 30 días · nivel 1','deliverable',array['communication','planning','collaboration']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-reevaluation-2','customer_success','Reevaluación a 30 días · nivel 2','deliverable',array['data','diagnosis','planning']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-reevaluation-3','customer_success','Reevaluación a 30 días · nivel 3','deliverable',array['negotiation','planning','communication']) on conflict(content_key) do nothing;
insert into public.learning_activity_catalog(content_key,route_key,title,kind,competencies) values('cs-reevaluation-4','customer_success','Reevaluación a 30 días · nivel 4','deliverable',array['documentation','collaboration','diagnosis']) on conflict(content_key) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('developer',1,'{"communication":"medium","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"high","deescalation":"medium","negotiation":"medium","planning":"medium","technical":"high","collaboration":"medium"}'::jsonb,'{"communication":2,"diagnosis":3,"data":2,"prioritization":2,"documentation":3,"deescalation":2,"negotiation":2,"planning":2,"technical":3,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('tech_support_l1',1,'{"communication":"high","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"medium","technical":"high","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":3,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":2,"planning":2,"technical":3,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('tech_support_l2',1,'{"communication":"medium","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"high","deescalation":"medium","negotiation":"medium","planning":"medium","technical":"high","collaboration":"medium"}'::jsonb,'{"communication":2,"diagnosis":3,"data":2,"prioritization":2,"documentation":3,"deescalation":2,"negotiation":2,"planning":2,"technical":3,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('tech_support_l3',1,'{"communication":"medium","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"high","collaboration":"medium"}'::jsonb,'{"communication":2,"diagnosis":3,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":3,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('customer_support',1,'{"communication":"high","diagnosis":"medium","data":"medium","prioritization":"medium","documentation":"high","deescalation":"high","negotiation":"medium","planning":"medium","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":2,"data":2,"prioritization":2,"documentation":3,"deescalation":3,"negotiation":2,"planning":2,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('onboarding',1,'{"communication":"high","diagnosis":"medium","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"high"}'::jsonb,'{"communication":3,"diagnosis":2,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":3}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('customer_success',1,'{"communication":"high","diagnosis":"high","data":"high","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"high"}'::jsonb,'{"communication":3,"diagnosis":3,"data":3,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":3}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('account_manager',1,'{"communication":"high","diagnosis":"medium","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"high","planning":"high","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":2,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":3,"planning":3,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('key_account_manager',1,'{"communication":"medium","diagnosis":"medium","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"high","planning":"high","technical":"medium","collaboration":"high"}'::jsonb,'{"communication":2,"diagnosis":2,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":3,"planning":3,"technical":2,"collaboration":3}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('sdr_bdr',1,'{"communication":"high","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"high","deescalation":"medium","negotiation":"medium","planning":"medium","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":3,"data":2,"prioritization":2,"documentation":3,"deescalation":2,"negotiation":2,"planning":2,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('account_executive',1,'{"communication":"medium","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"high","planning":"high","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":2,"diagnosis":3,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":3,"planning":3,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('pre_sales',1,'{"communication":"high","diagnosis":"high","data":"medium","prioritization":"medium","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"medium","technical":"high","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":3,"data":2,"prioritization":2,"documentation":2,"deescalation":2,"negotiation":2,"planning":2,"technical":3,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('project_manager',1,'{"communication":"medium","diagnosis":"medium","data":"medium","prioritization":"high","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"high"}'::jsonb,'{"communication":2,"diagnosis":2,"data":2,"prioritization":3,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":3}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('administrative_assistant',1,'{"communication":"medium","diagnosis":"medium","data":"medium","prioritization":"high","documentation":"high","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":2,"diagnosis":2,"data":2,"prioritization":3,"documentation":3,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('executive_assistant',1,'{"communication":"high","diagnosis":"medium","data":"medium","prioritization":"high","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"medium"}'::jsonb,'{"communication":3,"diagnosis":2,"data":2,"prioritization":3,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":2}'::jsonb) on conflict(position_key,version) do nothing;
insert into public.learning_job_profiles(position_key,version,weights,expected) values('manager_team_lead',1,'{"communication":"medium","diagnosis":"medium","data":"medium","prioritization":"high","documentation":"medium","deescalation":"medium","negotiation":"medium","planning":"high","technical":"medium","collaboration":"high"}'::jsonb,'{"communication":2,"diagnosis":2,"data":2,"prioritization":3,"documentation":2,"deescalation":2,"negotiation":2,"planning":3,"technical":2,"collaboration":3}'::jsonb) on conflict(position_key,version) do nothing;

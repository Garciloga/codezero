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

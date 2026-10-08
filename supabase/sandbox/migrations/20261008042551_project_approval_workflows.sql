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

-- DRAFT ONLY: do not run on production until academic entitlements, team permissions and QA approved.
-- When tested: apply only to isolated Supabase sandbox, never use live billing.
alter table public.organization_team_grants add column if not exists can_assign_courses boolean not null default false;
-- Viewing a team does not grant the distinct permission to assign a learning course.
create table if not exists public.organization_course_assignment_drafts(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 user_id uuid not null,
 team_id uuid,
 course_key text not null check(course_key in ('grc_advanced','red_flags','cross_sell','upsell','retention','onboarding_30_60_90','ai_at_work','professional_languages','candidate_assessment','metrics_lab','employability','manager_toolkit')),
 competency text not null check(competency in ('communication','diagnosis','data','prioritization','documentation','deescalation','negotiation','planning','technical','collaboration')),
 emphasis text not null check(emphasis in ('base','focused','intensive')),
 due_at date not null,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 status text not null default 'draft' check(status in ('draft','revoked')),
 foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id) on delete cascade,
 foreign key(organization_id,team_id) references public.organization_teams(organization_id,id) on delete cascade,
 unique(organization_id,user_id,course_key,competency)
);
create index if not exists assignment_drafts_person_idx on public.organization_course_assignment_drafts(organization_id,user_id,due_at);
alter table public.organization_course_assignment_drafts enable row level security;
revoke all on public.organization_course_assignment_drafts from anon,authenticated,public;
grant select on public.organization_course_assignment_drafts to authenticated;
create policy assignment_drafts_self_read on public.organization_course_assignment_drafts for select to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.organization_memberships m where m.organization_id=organization_course_assignment_drafts.organization_id and m.user_id=(select auth.uid()) and m.active));
create or replace function public.assign_draft_learning_route(
 p_org uuid,p_actor uuid,p_user uuid,p_team uuid,p_course text,p_competency text,p_emphasis text,p_due date
) returns integer
language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare actor_role text;count_saved int=0;
begin
 if p_actor is null or p_org is null or p_due<=current_date or p_due>current_date+365
  or p_course not in ('grc_advanced','red_flags','cross_sell','upsell','retention','onboarding_30_60_90','ai_at_work','professional_languages','candidate_assessment','metrics_lab','employability','manager_toolkit')
  or p_competency not in ('communication','diagnosis','data','prioritization','documentation','deescalation','negotiation','planning','technical','collaboration')
  or p_emphasis not in ('base','focused','intensive') then raise exception 'INVALID_ASSIGNMENT';end if;
 select m.role into actor_role from public.organization_memberships m
 join public.profiles p on p.id=m.user_id
 where m.organization_id=p_org and m.user_id=p_actor and m.active and p.status='active';
 if actor_role is null or actor_role not in ('owner','admin','manager','supervisor') then raise exception 'NOT_AUTHORIZED';end if;
 if p_team is not null and not exists(select 1 from public.organization_teams t where t.id=p_team and t.organization_id=p_org) then raise exception 'UNKNOWN_TEAM';end if;
 -- Team-wide assignment is only allowed for members of a team whose manager has explicit visibility.
 if p_user is null and p_team is null then raise exception 'TARGET_REQUIRED';end if;
 with authorized_targets as (
  select m.user_id from public.organization_memberships m
  join public.profiles p on p.id=m.user_id and p.status='active'
  where m.organization_id=p_org and m.active
   and (p_user is null or m.user_id=p_user)
   and (p_team is null or exists(select 1 from public.organization_team_members tm where tm.organization_id=p_org and tm.team_id=p_team and tm.user_id=m.user_id))
   and (
    actor_role in ('owner','admin')
    or m.reports_to=p_actor
    or exists(
     select 1 from public.organization_team_members tm
     join public.organization_team_grants g on g.organization_id=tm.organization_id and g.team_id=tm.team_id
     where tm.organization_id=p_org and tm.user_id=m.user_id and g.user_id=p_actor and g.can_assign_courses
      and (p_team is null or tm.team_id=p_team)
    )
   )
 ),
 written as (
  insert into public.organization_course_assignment_drafts(organization_id,user_id,team_id,course_key,competency,emphasis,due_at,created_by)
  select p_org,at.user_id,p_team,p_course,p_competency,p_emphasis,p_due,p_actor from authorized_targets at
  on conflict (organization_id,user_id,course_key,competency)
  do update set emphasis=excluded.emphasis,team_id=excluded.team_id,due_at=excluded.due_at,updated_at=now(),created_by=excluded.created_by,status='draft'
  returning 1
 )
 select count(*) into count_saved from written;
 if count_saved=0 then raise exception 'NO_AUTHORIZED_TARGETS';end if;
 if count_saved>200 then raise exception 'MAX_TEAM_ASSIGNMENTS_EXCEEDED';end if;
 return count_saved;
end$$;
revoke all on function public.assign_draft_learning_route(uuid,uuid,uuid,uuid,text,text,text,date) from public,anon,authenticated;
grant execute on function public.assign_draft_learning_route(uuid,uuid,uuid,uuid,text,text,text,date) to service_role;



-- Stage-1 authenticated workflow for educational *draft decisions*, isolated in sandbox.
-- This is NOT published learning progress: it writes neither lesson_progress nor
-- learning_assignments, evidence_history, certificates, quotas, grades or billing.
-- The source academy still needs five exercises per unit and final human project review.
alter table public.organization_course_assignment_drafts
 add constraint assignment_draft_identity_unique unique(id,organization_id,user_id);

create table public.organization_course_decision_drafts(
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null,
 organization_id uuid not null,
 user_id uuid not null,
 level_number int not null check(level_number between 1 and 15),
 unit_number int not null check(unit_number between 1 and 6),
 phase_number int not null check(phase_number between 1 and 3),
 option_key text not null check(option_key in ('a','b','c')),
 reasoning text not null check(char_length(reasoning) between 220 and 6000),
 evidence_reference text not null check(char_length(evidence_reference) between 8 and 300),
 revision int not null default 1 check(revision>=1),
 status text not null default 'submitted' check(status in ('submitted','approved','needs_changes')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 unique(assignment_id,level_number,unit_number,phase_number),
 foreign key(assignment_id,organization_id,user_id)
  references public.organization_course_assignment_drafts(id,organization_id,user_id) on delete cascade
);
create index draft_decisions_employee_idx on public.organization_course_decision_drafts(organization_id,user_id,assignment_id);
alter table public.organization_course_decision_drafts enable row level security;
revoke all on public.organization_course_decision_drafts from public,anon,authenticated;
grant select on public.organization_course_decision_drafts to authenticated;
create policy draft_decisions_learner_read on public.organization_course_decision_drafts
 for select to authenticated using (
  user_id=(select auth.uid())
  and exists(select 1 from public.organization_memberships m
   join public.profiles p on p.id=m.user_id and p.status='active'
   where m.organization_id=organization_course_decision_drafts.organization_id
    and m.user_id=(select auth.uid()) and m.active)
);

create table public.organization_course_decision_reviews_drafts(
 id uuid primary key default gen_random_uuid(),
 decision_id uuid not null references public.organization_course_decision_drafts(id) on delete cascade,
 decision_revision int not null check(decision_revision>=1),
 reviewer_id uuid not null references public.profiles(id),
 score_accuracy int not null check(score_accuracy between 0 and 4),
 score_analysis int not null check(score_analysis between 0 and 4),
 score_decisions int not null check(score_decisions between 0 and 4),
 score_privacy int not null check(score_privacy between 0 and 4),
 score_evidence int not null check(score_evidence between 0 and 4),
 score_100 int not null check(score_100 between 0 and 100),
 critical_error boolean not null,
 feedback text not null check(char_length(feedback) between 40 and 3000),
 decision_status text not null check(decision_status in ('approved','needs_changes')),
 reviewed_at timestamptz not null default now(),
 unique(decision_id,decision_revision)
);
create index draft_reviews_decision_idx on public.organization_course_decision_reviews_drafts(decision_id,reviewed_at);
alter table public.organization_course_decision_reviews_drafts enable row level security;
revoke all on public.organization_course_decision_reviews_drafts from public,anon,authenticated;
grant select on public.organization_course_decision_reviews_drafts to authenticated;
create policy draft_reviews_learner_read on public.organization_course_decision_reviews_drafts
 for select to authenticated using (
  exists (select 1 from public.organization_course_decision_drafts d
   join public.organization_memberships m on m.organization_id=d.organization_id and m.user_id=d.user_id and m.active
   join public.profiles p on p.id=m.user_id and p.status='active'
   where d.id=organization_course_decision_reviews_drafts.decision_id
    and d.user_id=(select auth.uid()))
);

-- Actor ID is supplied only by an authenticated server route using service_role.
-- PostgreSQL rejects unauthenticated direct RPC and direct DML with RLS+GRANT.
create or replace function public.submit_draft_course_decision(
 p_actor uuid,p_assignment uuid,p_level int,p_unit int,p_phase int,
 p_option text,p_reasoning text,p_evidence_reference text
) returns uuid language plpgsql security definer
 set search_path=pg_catalog,public,pg_temp as $$
declare a record;current_status text;decision_id uuid;latest_revision int;
begin
 if p_actor is null or p_assignment is null
    or p_level is null or p_level not between 1 and 15
    or p_unit is null or p_unit not between 1 and 6
    or p_phase is null or p_phase not between 1 and 3
    or p_option is null or p_option not in ('a','b','c')
    or p_reasoning is null or char_length(p_reasoning) not between 220 and 6000
    or p_evidence_reference is null or char_length(p_evidence_reference) not between 8 and 300
 then raise exception 'INVALID_DECISION';end if;
 select c.* into a from public.organization_course_assignment_drafts c
  join public.organization_memberships m on m.organization_id=c.organization_id and m.user_id=c.user_id and m.active
  join public.profiles p on p.id=m.user_id and p.status='active'
  where c.id=p_assignment and c.user_id=p_actor and c.status='draft' for update of c;
 if not found then raise exception 'ASSIGNMENT_UNAVAILABLE';end if;
 if p_phase>1 and not exists(select 1 from public.organization_course_decision_drafts d
  where d.assignment_id=p_assignment and d.level_number=p_level and d.unit_number=p_unit
   and d.phase_number=p_phase-1 and d.status='approved') then raise exception 'PREVIOUS_PHASE_REQUIRED';end if;
 if p_phase=1 and p_unit>1 and not exists(select 1 from public.organization_course_decision_drafts d
  where d.assignment_id=p_assignment and d.level_number=p_level and d.unit_number=p_unit-1
   and d.phase_number=3 and d.status='approved') then raise exception 'PREVIOUS_UNIT_REQUIRED';end if;
 if p_phase=1 and p_unit=1 and p_level>1 and not exists(select 1 from public.organization_course_decision_drafts d
  where d.assignment_id=p_assignment and d.level_number=p_level-1 and d.unit_number=6
   and d.phase_number=3 and d.status='approved') then raise exception 'PREVIOUS_LEVEL_REQUIRED';end if;
 select d.id,d.status,d.revision into decision_id,current_status,latest_revision
 from public.organization_course_decision_drafts d
 where d.assignment_id=p_assignment and d.level_number=p_level and d.unit_number=p_unit and d.phase_number=p_phase
 for update;
 if found then
   if current_status<>'needs_changes' then raise exception 'DECISION_ALREADY_SUBMITTED';end if;
   update public.organization_course_decision_drafts
    set option_key=p_option,reasoning=p_reasoning,evidence_reference=p_evidence_reference,
        revision=latest_revision+1,status='submitted',submitted_at=now(),reviewed_at=null
    where id=decision_id;
 else
   insert into public.organization_course_decision_drafts
     (assignment_id,organization_id,user_id,level_number,unit_number,phase_number,option_key,reasoning,evidence_reference)
   values(p_assignment,a.organization_id,p_actor,p_level,p_unit,p_phase,p_option,p_reasoning,p_evidence_reference)
   returning id into decision_id;
 end if;
 return decision_id;
end$$;
revoke all on function public.submit_draft_course_decision(uuid,uuid,int,int,int,text,text,text)
 from public,anon,authenticated;
grant execute on function public.submit_draft_course_decision(uuid,uuid,int,int,int,text,text,text) to service_role;

create or replace function public.review_draft_course_decision(
 p_actor uuid,p_decision uuid,p_accuracy int,p_analysis int,p_decisions int,
 p_privacy int,p_evidence int,p_critical_error boolean,p_feedback text
) returns text language plpgsql security definer
 set search_path=pg_catalog,public,pg_temp as $$
declare d record;reviewer_role text;score int;minimum int;result text;
begin
 if p_actor is null or p_decision is null or p_critical_error is null
  or p_feedback is null or char_length(p_feedback) not between 40 and 3000
  or p_accuracy is null or p_accuracy not between 0 and 4
  or p_analysis is null or p_analysis not between 0 and 4
  or p_decisions is null or p_decisions not between 0 and 4
  or p_privacy is null or p_privacy not between 0 and 4
  or p_evidence is null or p_evidence not between 0 and 4
 then raise exception 'INVALID_REVIEW';end if;
 select dc.*,a.status as assignment_status into d
  from public.organization_course_decision_drafts dc
  join public.organization_course_assignment_drafts a on a.id=dc.assignment_id
  where dc.id=p_decision for update of dc;
 if not found or d.status<>'submitted' or d.assignment_status<>'draft'
 then raise exception 'DECISION_UNAVAILABLE';end if;
 if d.user_id=p_actor then raise exception 'INDEPENDENT_REVIEW_REQUIRED';end if;
 select m.role into reviewer_role from public.organization_memberships m
  join public.profiles p on p.id=m.user_id and p.status='active'
  where m.organization_id=d.organization_id and m.user_id=p_actor and m.active;
 if reviewer_role is null or reviewer_role not in ('owner','admin','manager','supervisor')
 then raise exception 'REVIEW_NOT_AUTHORIZED';end if;
 -- Reviewing is deliberately narrower than course assignment or mere can_view grant.
 if reviewer_role not in ('owner','admin') and not exists(
   select 1 from public.organization_memberships m
    where m.organization_id=d.organization_id and m.user_id=d.user_id and m.active
      and m.reports_to=p_actor
 ) then raise exception 'REVIEW_SCOPE_DENIED';end if;
 score=(p_accuracy+p_analysis+p_decisions+p_privacy+p_evidence)*5;
 minimum=case when d.level_number>=12 then 90 when d.level_number>=8 then 88
   when d.level_number>=4 then 84 else 80 end;
 result=case when not p_critical_error and score>=minimum
   and least(p_accuracy,p_analysis,p_decisions,p_privacy,p_evidence)>=3
   then 'approved' else 'needs_changes' end;
 insert into public.organization_course_decision_reviews_drafts
  (decision_id,decision_revision,reviewer_id,score_accuracy,score_analysis,score_decisions,score_privacy,
   score_evidence,score_100,critical_error,feedback,decision_status)
 values(p_decision,d.revision,p_actor,p_accuracy,p_analysis,p_decisions,p_privacy,p_evidence,
   score,p_critical_error,p_feedback,result);
 update public.organization_course_decision_drafts set status=result,reviewed_at=now() where id=p_decision;
 return result;
end$$;
revoke all on function public.review_draft_course_decision(uuid,uuid,int,int,int,int,int,boolean,text)
 from public,anon,authenticated;
grant execute on function public.review_draft_course_decision(uuid,uuid,int,int,int,int,int,boolean,text) to service_role;

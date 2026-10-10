-- DRAFT ONLY: do not run on production until academic entitlements, team permissions and QA approved.
-- When tested: apply only to isolated Supabase sandbox, never use live billing.
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
     where tm.organization_id=p_org and tm.user_id=m.user_id and g.user_id=p_actor and g.can_view
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

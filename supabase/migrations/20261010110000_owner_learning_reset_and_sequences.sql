-- 1) Ordering activities: the correct order lives next to the other answer keys,
--    which clients can never read (RLS "No client access to exercise solutions").
alter table public.exercise_solutions add column if not exists correct_sequence text;
do $$begin
 if not exists(select 1 from pg_constraint where conname='exercise_solutions_sequence_check') then
  alter table public.exercise_solutions add constraint exercise_solutions_sequence_check
   check (correct_sequence is null or correct_sequence ~ '^[ABCD]{4}$');
 end if;
end$$;

-- 2) Owner-only reset of a learner's progress. Certificates and diplomas already
--    issued are never touched; quotas and usage counters are not restored.
--    Rollback: drop function public.owner_reset_learning(uuid,uuid,text,text,uuid,text);
--              drop table codezero_private.learning_resets;
--              alter table public.exercise_solutions drop column correct_sequence;
create table if not exists codezero_private.learning_resets(
 id bigint generated always as identity primary key,
 request_id uuid not null unique,
 actor_id uuid not null,
 target_id uuid not null,
 scope text not null check (scope in ('main','positions','all')),
 fee_cents integer not null default 1500 check (fee_cents >= 0),
 currency text not null default 'MXN',
 payment_reference text,
 removed jsonb not null,
 created_at timestamptz not null default now()
);
alter table codezero_private.learning_resets enable row level security;
revoke all on codezero_private.learning_resets from public, anon, authenticated;

create or replace function public.owner_reset_learning(p_actor uuid,p_target uuid,p_email text,p_scope text,p_request uuid,p_reference text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare removed jsonb := '{}'::jsonb; n integer; previous jsonb; subs uuid[];
begin
 if p_scope not in ('main','positions','all') or p_request is null then raise exception 'INVALID_SCOPE'; end if;
 if not exists(select 1 from public.profiles where id=p_actor and role='owner' and status='active') then raise exception 'FORBIDDEN'; end if;
 if p_target is null or p_target=p_actor then raise exception 'INVALID_TARGET'; end if;
 if not exists(select 1 from public.profiles where id=p_target and lower(email)=lower(btrim(coalesce(p_email,'')))) then raise exception 'EMAIL_MISMATCH'; end if;
 -- One reset per target at a time; a repeated request returns the first result.
 perform pg_advisory_xact_lock(hashtextextended(p_target::text,7));
 select r.removed into previous from codezero_private.learning_resets r where r.request_id=p_request;
 if found then return previous || jsonb_build_object('replay',true); end if;

 if p_scope in ('main','all') then
  delete from public.exam_sittings where user_id=p_target; get diagnostics n=row_count; removed := removed || jsonb_build_object('exam_sittings',n);
  delete from public.exam_attempts where user_id=p_target; get diagnostics n=row_count; removed := removed || jsonb_build_object('exam_attempts',n);
  delete from public.exercise_attempts where user_id=p_target; get diagnostics n=row_count; removed := removed || jsonb_build_object('exercise_attempts',n);
  delete from public.lesson_progress where user_id=p_target; get diagnostics n=row_count; removed := removed || jsonb_build_object('lesson_progress',n);
  delete from public.project_submissions where user_id=p_target; get diagnostics n=row_count; removed := removed || jsonb_build_object('project_submissions',n);
 end if;

 if p_scope in ('positions','all') then
  select coalesce(array_agg(s.id),'{}') into subs from public.learning_practice_submissions s
   join public.learning_activity_catalog a on a.id=s.activity_id where s.user_id=p_target and a.content_key like 'position-%';
  update public.learning_practice_submissions set reevaluation_of=null where id=any(subs) and reevaluation_of is not null;
  update public.learning_project_review_runs set final_evidence_id=null where submission_id=any(subs) and final_evidence_id is not null;
  delete from public.learning_evidence_history where user_id=p_target and submission_id=any(subs);
  delete from public.learning_practice_submissions where id=any(subs); get diagnostics n=row_count; removed := removed || jsonb_build_object('position_submissions',n);
  delete from public.learning_evidence where user_id=p_target and activity_key like 'position-%'; get diagnostics n=row_count; removed := removed || jsonb_build_object('position_evidence',n);
 end if;

 insert into codezero_private.learning_resets(request_id,actor_id,target_id,scope,payment_reference,removed)
  values(p_request,p_actor,p_target,p_scope,nullif(left(btrim(coalesce(p_reference,'')),120),''),removed);
 insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata)
  values(p_actor,'learning_reset','user',p_target::text,jsonb_build_object('scope',p_scope,'fee_cents',1500,'currency','MXN','removed',removed));
 return removed;
end$$;
revoke all on function public.owner_reset_learning(uuid,uuid,text,text,uuid,text) from public, anon, authenticated;
grant execute on function public.owner_reset_learning(uuid,uuid,text,text,uuid,text) to service_role;

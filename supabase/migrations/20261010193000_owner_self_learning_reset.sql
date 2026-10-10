-- Owner-only self-learning reset. This is independent from the existing fee-bearing
-- learner reset RPC, does not touch subscriptions, Auth, organizations or certificates.
create table if not exists codezero_private.owner_self_learning_resets (
  request_id uuid primary key,
  owner_id uuid not null,
  removed jsonb not null,
  created_at timestamptz not null default now()
);
alter table codezero_private.owner_self_learning_resets enable row level security;
revoke all on codezero_private.owner_self_learning_resets from public, anon, authenticated;

create or replace function public.owner_reset_own_learning(
  p_actor uuid, p_email text, p_phrase text, p_request uuid
) returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  result jsonb := '{}'::jsonb;
  previous jsonb;
  n integer := 0;
  personal_ids uuid[];
  stored_email text;
begin
  if p_actor is null or p_request is null or p_phrase <> 'REINICIAR MI PROGRESO' then
    raise exception 'INVALID_CONFIRMATION';
  end if;
  select email into stored_email from public.profiles
    where id=p_actor and role='owner' and status='active';
  if not found then raise exception 'OWNER_ONLY'; end if;
  if lower(btrim(coalesce(p_email,''))) <> lower(stored_email) then
    raise exception 'EMAIL_MISMATCH';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor::text, 2468));
  select removed into previous from codezero_private.owner_self_learning_resets
    where request_id=p_request and owner_id=p_actor;
  if found then return previous || jsonb_build_object('replay',true); end if;
  if exists(select 1 from codezero_private.owner_self_learning_resets
    where request_id=p_request and owner_id<>p_actor) then raise exception 'REQUEST_CONFLICT'; end if;

  -- Original technical course attempts. Clear all for this owner only.
  delete from public.exam_sittings where user_id=p_actor;
  get diagnostics n=row_count; result := result || jsonb_build_object('exam_sittings',n);
  delete from public.exam_attempts where user_id=p_actor;
  get diagnostics n=row_count; result := result || jsonb_build_object('exam_attempts',n);
  delete from public.exercise_attempts where user_id=p_actor;
  get diagnostics n=row_count; result := result || jsonb_build_object('exercise_attempts',n);
  delete from public.lesson_progress where user_id=p_actor;
  get diagnostics n=row_count; result := result || jsonb_build_object('lesson_progress',n);
  delete from public.project_submissions where user_id=p_actor;
  get diagnostics n=row_count; result := result || jsonb_build_object('project_submissions',n);

  -- Reset the owner's own PERSONAL (no company) role-program, written exercise and
  -- decision-case submissions. Company evidence is legally/commercially distinct.
  select coalesce(array_agg(id),'{}') into personal_ids
    from public.learning_practice_submissions
    where user_id=p_actor and organization_id is null;

  -- Remove references to PERSONAL evidence before deleting it. Never touch
  -- training records of other people, company submissions or company history.
  update public.learning_practice_submissions
    set reevaluation_of=null
    where user_id=p_actor and organization_id is null and reevaluation_of in
      (select id from public.learning_evidence_history
        where user_id=p_actor and organization_id is null
          and submission_id=any(personal_ids));
  update public.learning_evidence_history
    set reevaluation_of=null
    where user_id=p_actor and organization_id is null and reevaluation_of in
      (select id from public.learning_evidence_history
        where user_id=p_actor and organization_id is null
          and submission_id=any(personal_ids));
  update public.learning_project_review_runs
    set final_evidence_id=null
    where submission_id=any(personal_ids) and final_evidence_id is not null;
  delete from public.learning_evidence_history
    where user_id=p_actor and organization_id is null and submission_id=any(personal_ids);
  get diagnostics n=row_count; result:=result||jsonb_build_object('personal_evidence_history',n);
  delete from public.learning_practice_submissions
    where user_id=p_actor and organization_id is null;
  get diagnostics n=row_count; result:=result||jsonb_build_object('personal_learning_submissions',n);

  insert into codezero_private.owner_self_learning_resets(request_id,owner_id,removed)
    values (p_request,p_actor,result);
  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata)
    values(p_actor,'owner_self_learning_reset','user',p_actor::text,
      jsonb_build_object('removed',result,'preserved_company_data',true,
        'preserved_certificates',true,'fee_cents',0));
  return result;
end $$;
revoke all on function public.owner_reset_own_learning(uuid,text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.owner_reset_own_learning(uuid,text,text,uuid)
  to service_role;

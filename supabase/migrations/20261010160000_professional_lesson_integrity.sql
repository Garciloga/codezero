-- Additive hardening: all role lessons must have a completely correct, server-graded decision attempt
-- before an exam unlocks. Historical submissions and certificates are not deleted.
-- NOTE: This migration must be applied and verified BEFORE the matching API handlers are deployed.
create or replace function public.submit_position_practice(p_actor uuid,p_activity_key text,p_request uuid,p_org uuid,p_draft text,p_answers jsonb,p_assistance text default 'guided') returns text language plpgsql security invoker set search_path='' as $$
declare a public.learning_activity_catalog;m codezero_private.position_assessments;old public.learning_practice_submissions;r jsonb:='[]';scores jsonb;v jsonb;i integer:=0;q jsonb;approved boolean;project_key text;program codezero_private.position_programs;
begin
 if p_actor is null or not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN';end if;
 if p_org is not null and not exists(select 1 from public.organization_memberships s join public.organizations o on o.id=s.organization_id where s.user_id=p_actor and s.organization_id=p_org and s.active and o.active) then raise exception 'FORBIDDEN';end if;
 select * into a from public.learning_activity_catalog where content_key=p_activity_key and active;if not found then raise exception 'INVALID_ACTIVITY';end if;
 select * into m from codezero_private.position_assessments where activity_key=p_activity_key;if not found then raise exception 'INVALID_ACTIVITY';end if;
 if m.item_type<>'diagnostic' and not exists(select 1 from public.profiles p where p.id=p_actor and p.status='active' and (p.role in('owner','admin') or p.plan_name in('pro','enterprise') or public.company_learning_plan(p_actor,p_org) in('pro','enterprise'))) then raise exception 'COURSE_PLAN_REQUIRED';end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>cardinality(m.correct_answers) or p_request is null or p_assistance not in('guided','independent') then raise exception 'INVALID_ANSWERS';end if;
 for v in select value from jsonb_array_elements(p_answers) loop
  i:=i+1;if jsonb_typeof(v)<>'number' or v::text !~ '^[0-9]$' or v::text::integer<0 or v::text::integer>=m.option_counts[i] then raise exception 'INVALID_ANSWERS';end if;
  r:=r||jsonb_build_array(case when v::text::integer=m.correct_answers[i] then 1 else 0 end);
 end loop;
 select jsonb_object_agg(k,1) into scores from unnest(a.competencies) k;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||coalesce(p_org::text,'personal')||'position-'||m.position_key,0));
 select * into old from public.learning_practice_submissions where id=p_request;
 if found then
  if old.user_id<>p_actor or old.organization_id is distinct from p_org or old.activity_id<>a.id or old.answers<>p_answers or old.draft<>p_draft or old.assistance<>(case when a.kind='exercise' then 'recognition' else p_assistance end) then raise exception 'REQUEST_CONFLICT';end if;
  return case when m.item_type='exam' and (select count(*) from jsonb_array_elements(r) x where x='1'::jsonb)>=4 then 'passed' when m.item_type='exam' then 'failed' else 'saved' end;
 end if;
 if m.level_number>1 and not public.position_level_passed(p_actor,p_org,m.level_number-1,m.position_key) then raise exception 'PREVIOUS_LEVEL_REQUIRED';end if;
 if m.item_type='exam' then
  if exists(select 1 from codezero_private.position_assessments x where x.position_key=m.position_key and x.item_type='lesson' and x.level_number=m.level_number
   and not exists(select 1 from public.learning_practice_submissions s join public.learning_activity_catalog c on c.id=s.activity_id where s.user_id=p_actor and s.organization_id is not distinct from p_org and c.content_key=x.activity_key and s.answers=to_jsonb(x.correct_answers))) then raise exception 'LESSONS_NOT_PASSED';end if;
  -- A level with a project in this position requires that project to be approved by a reviewer.
  select x.activity_key into project_key from codezero_private.position_assessments x where x.position_key=m.position_key and x.item_type='project' and x.level_number=m.level_number order by x.activity_key limit 1;
  if project_key is not null then
   select coalesce(cardinality(e.critical_errors)=0 and not exists(select 1 from jsonb_each(e.competency_scores) x where x.value::text::integer<3),false) into approved
   from public.learning_evidence_history e where e.user_id=p_actor and e.organization_id is not distinct from p_org and e.activity_key=project_key and e.review_source in('manager','admin') and e.reviewed_by<>p_actor order by e.observed_at desc,e.id desc limit 1;
   if not coalesce(approved,false) then raise exception 'PROJECT_APPROVAL_REQUIRED';end if;
  end if;
  q:=public.consume_quota(p_actor,'exams',1);if not coalesce((q->>'allowed')::boolean,false) then return 'limit';end if;
 end if;
 if m.item_type='project' and (p_draft is null or length(trim(p_draft))<300) then raise exception 'INCOMPLETE_PROJECT';end if;
 perform public.submit_training_practice(p_actor,a.id,p_request,p_org,p_draft,scores,case when a.kind='exercise' then 'recognition' else p_assistance end,p_answers,r,null);
 if m.item_type='exam' then
  select * into program from codezero_private.position_programs where position_key=m.position_key;
  if found and m.level_number=program.levels and not exists(select 1 from generate_series(1,program.levels) n where not public.position_level_passed(p_actor,p_org,n,m.position_key)) then
   insert into public.certificates(user_id,certificate_type,title,metadata) values(p_actor,program.certificate_type,program.certificate_title,jsonb_build_object('curriculum_version',program.curriculum_version,'organization_id',p_org,'lessons',program.lessons,'levels',program.levels,'required_projects',program.required_projects,'included_in_plan',true,'certificate_fee_cents',0,'editorial_review','pending','workplace_performance_validated',false)) on conflict(user_id,certificate_type) do nothing;
  end if;
 end if;
 return case when m.item_type='exam' and (select count(*) from jsonb_array_elements(r) x where x='1'::jsonb)>=4 then 'passed' when m.item_type='exam' then 'failed' else 'saved' end;
end $$;

-- Atomic attempt persistence and quota accounting. Invoker-only, service_role-only RPC.
-- Lock per learner/activity ensures two concurrent submissions cannot both be free checks.
create or replace function public.submit_graded_lesson_attempt(
 p_user uuid,p_exercise bigint,p_answer text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare e record; last_attempt record; passed_before boolean; quota jsonb; v_correct boolean; v_category text;
begin
 if p_user is null or not exists(select 1 from public.profiles where id=p_user and status='active') then
   raise exception 'FORBIDDEN';
 end if;
 select x.kind,x.status,s.correct_answer,s.correct_sequence into e
 from public.exercises x join public.lessons l on l.id=x.lesson_id
 join public.exercise_solutions s on s.exercise_id=x.id
 where x.id=p_exercise and x.status='published' and l.status='published' and exists (select 1 from public.levels v join public.courses c on c.id=v.course_id where v.id=l.level_id and v.status='published' and c.status='published');
 if not found then raise exception 'EXERCISE_NOT_PUBLISHED';end if;
 if (e.kind='order_steps' and (p_answer !~ '^[ABCD]{4}$' or length(p_answer)<>4))
    or (e.kind<>'order_steps' and p_answer !~ '^[ABCD]$') then raise exception 'INVALID_ANSWER';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_exercise::text,17));
 select a.is_correct,a.answer into last_attempt from public.exercise_attempts a
 where a.user_id=p_user and a.exercise_id=p_exercise and a.answer=p_answer
 and a.created_at>=clock_timestamp()-interval '3 seconds'
 order by a.created_at desc,a.id desc limit 1;
 if found then
  return jsonb_build_object('result',case when last_attempt.is_correct then 'correct' else 'incorrect' end,'replay',true);
 end if;
 select exists(select 1 from public.exercise_attempts a where a.user_id=p_user and a.exercise_id=p_exercise and a.is_correct) into passed_before;
 if passed_before then
  quota:=public.consume_quota(p_user,'exercises',1);
  if not coalesce((quota->>'allowed')::boolean,false) then return jsonb_build_object('result','limit');end if;
  v_category:='practice';
 else v_category:='lesson_check';
 end if;
 v_correct:=p_answer=(case when e.kind='order_steps' then e.correct_sequence else e.correct_answer end);
 if e.kind='order_steps' and e.correct_sequence is null then raise exception 'SOLUTION_NOT_FOUND';end if;
 insert into public.exercise_attempts(user_id,exercise_id,answer,is_correct,category)
 values(p_user,p_exercise,p_answer,v_correct,v_category);
 -- Quota and attempt are written in the SAME transaction; a failed insert rolls back the quota.
 return jsonb_build_object('result',case when v_correct then 'correct' else 'incorrect' end,'category',v_category,'replay',false);
end $$;
revoke all on function public.submit_graded_lesson_attempt(uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.submit_graded_lesson_attempt(uuid,bigint,text) to service_role;

-- Final verification inside the same transaction that writes lesson_progress.
create or replace function public.complete_verified_lesson(p_user uuid,p_lesson bigint)
returns text language plpgsql security invoker set search_path='' as $$
declare target record;
begin
 if p_user is null or not exists(select 1 from public.profiles where id=p_user and status='active') then
  raise exception 'FORBIDDEN';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':complete:'||p_lesson::text,19));
 select l.id,l.level_id,l.sort_order into target from public.lessons l where l.id=p_lesson and l.status='published' and exists (select 1 from public.levels v join public.courses c on c.id=v.course_id where v.id=l.level_id and v.status='published' and c.status='published');
 if not found then return 'not_published';end if;
 if exists(select 1 from public.lesson_progress p where p.user_id=p_user and p.lesson_id=p_lesson and p.status='completed') then return 'completed';end if;
 if exists(select 1 from public.lessons l where l.level_id=target.level_id and l.status='published'
   and (l.sort_order<target.sort_order or (l.sort_order=target.sort_order and l.id<target.id))
   and not exists(select 1 from public.lesson_progress p where p.user_id=p_user and p.lesson_id=l.id and p.status='completed')) then
  return 'locked';
 end if;
 if not exists(select 1 from public.exercises x where x.lesson_id=p_lesson and x.status='published') then return 'blocked';end if;
 if exists(select 1 from public.exercises x where x.lesson_id=p_lesson and x.status='published'
   and not exists(select 1 from public.exercise_attempts a where a.user_id=p_user and a.exercise_id=x.id and a.is_correct)) then
  return 'blocked';
 end if;
 insert into public.lesson_progress(user_id,lesson_id,status,progress_percent,started_at,completed_at,verified_at,updated_at)
 values(p_user,p_lesson,'completed',100,now(),now(),now(),now())
 on conflict(user_id,lesson_id) do update set status='completed',progress_percent=100,
   completed_at=now(),verified_at=now(),updated_at=now(),
   started_at=coalesce(public.lesson_progress.started_at,now())
 where public.lesson_progress.status<>'completed';
 return 'completed';
end $$;
revoke all on function public.complete_verified_lesson(uuid,bigint) from public,anon,authenticated;
grant execute on function public.complete_verified_lesson(uuid,bigint) to service_role;

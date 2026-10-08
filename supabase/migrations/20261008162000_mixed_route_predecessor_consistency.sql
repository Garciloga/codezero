-- A step consumes the latest preceding artifact from the same learner and scope.
-- Serialize each case so concurrent resubmissions cannot silently change its input.
create or replace function public.submit_mixed_training(p_actor uuid,p_step text,p_request uuid,p_org uuid,p_payload jsonb,p_draft text,p_scores jsonb,p_assistance text,p_auto_results jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare step public.learning_mixed_steps; result uuid; old public.learning_mixed_submission_steps; preceding uuid; replay boolean;
begin
 if not exists(select 1 from public.learning_mixed_release where id and enabled) then raise exception 'MIXED_DISABLED';end if;
 select * into step from public.learning_mixed_steps where step_key=p_step;
 if not found or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>24000 then raise exception 'INVALID_MIXED_SUBMISSION';end if;
 perform pg_advisory_xact_lock(hashtextextended('mixed:'||p_actor::text||':'||step.unit_key||':'||coalesce(p_org::text,''),0));
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into old from public.learning_mixed_submission_steps where submission_id=p_request;
 replay=found;
 if replay and (old.step_key<>p_step or old.payload<>p_payload) then raise exception 'REQUEST_CONFLICT';end if;
 if not replay and step.ordinal>1 then
  select s.id into preceding from public.learning_mixed_submission_steps m
  join public.learning_practice_submissions s on s.id=m.submission_id
  join public.learning_mixed_steps previous on previous.step_key=m.step_key
  where previous.unit_key=step.unit_key and previous.ordinal=step.ordinal-1
   and s.user_id=p_actor and s.organization_id is not distinct from p_org
  order by s.created_at desc,s.id desc limit 1;
  if preceding is null or p_payload->>'previous_submission' is distinct from preceding::text then raise exception 'MIXED_PREVIOUS_CHANGED';end if;
 end if;
 result=public.submit_training_practice(p_actor,step.activity_id,p_request,p_org,p_draft,p_scores,p_assistance,'[]'::jsonb,p_auto_results,null);
 insert into public.learning_mixed_submission_steps(submission_id,step_key,payload) values(result,p_step,p_payload) on conflict(submission_id) do nothing;
 return result;
end$$;
revoke all on function public.submit_mixed_training(uuid,text,uuid,uuid,jsonb,text,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_mixed_training(uuid,text,uuid,uuid,jsonb,text,jsonb,text,jsonb) to service_role;

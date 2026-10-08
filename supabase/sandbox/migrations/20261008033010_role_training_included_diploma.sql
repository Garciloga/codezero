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

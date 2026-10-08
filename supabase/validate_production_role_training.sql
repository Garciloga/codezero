-- Production verification: existing active owner, temporary organization and learning data.
-- No Auth account is created or changed. Every mutation rolls back.
begin;
do $$
declare actor uuid; org uuid; request uuid:=gen_random_uuid(); activity bigint; project bigint; rejected boolean;
 selector jsonb:='{"all":false,"roles":["owner"],"positions":[],"users":[]}';
 draft text:=repeat('Prueba temporal: datos ficticios, evidencia verificable, decisión, responsable y siguiente comprobación. ',3);
begin
 select id into actor from public.profiles where role='owner' and status='active' limit 1;
 if actor is null then raise exception 'ACTIVE_OWNER_REQUIRED_FOR_CHECK';end if;
 org:=public.create_workspace_organization(actor,'VALIDATION ONLY production role-training rollback');
 perform set_config('training.production_actor',actor::text,true);perform set_config('training.production_org',org::text,true);
 select id into activity from public.learning_activity_catalog where content_key='common-communication';
 select id into project from public.learning_activity_catalog where content_key='cs-project-adoption';
 perform public.submit_training_practice(actor,activity,request,org,draft,'{"communication":3,"documentation":3}','guided','[0,1,0]','[1,1,1]');
 perform public.submit_training_practice(actor,activity,request,org,draft,'{"communication":3,"documentation":3}','guided','[0,1,0]','[1,1,1]');
 if (select count(*) from public.learning_evidence_history where submission_id=request)<>4 then raise exception 'REPLAY_DUPLICATION';end if;
 rejected:=false;begin perform public.review_training_practice(actor,request,'{"communication":3,"documentation":3}',draft,'{}');exception when others then rejected:=sqlerrm='SELF_REVIEW_FORBIDDEN';end;
 if not rejected then raise exception 'SELF_APPROVAL_ALLOWED';end if;
 perform public.save_project_review_flow(actor,org,null,0,'Temporary production review check',true,100,selector,jsonb_build_array(jsonb_build_object('name','Owner reviewer','required',1,'reviewers',selector)));
 rejected:=false;begin perform public.submit_training_practice(actor,project,gen_random_uuid(),org,draft,'{"data":3,"diagnosis":3,"planning":3}','independent','[]','[]');exception when others then rejected:=sqlerrm='INSUFFICIENT_REVIEWERS';end;
 if not rejected then raise exception 'IMPOSSIBLE_QUORUM_ALLOWED';end if;
 if (select count(*) from public.learning_practice_submissions where organization_id=org)<>1 then raise exception 'SUBMISSION_NOT_ATOMIC';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('training.production_actor'),true);
do $$declare denied boolean:=false;begin
 if (select count(*) from public.learning_evidence_history where organization_id=current_setting('training.production_org')::uuid)<>4 then raise exception 'OWN_HISTORY_RLS';end if;
 if (select count(*) from public.learning_project_review_flows where organization_id=current_setting('training.production_org')::uuid)<>1 then raise exception 'OWN_FLOW_RLS';end if;
 if (select count(*) from public.learning_activity_catalog)<>53 then raise exception 'CATALOG_RLS';end if;
 begin delete from public.learning_evidence_history where organization_id=current_setting('training.production_org')::uuid;exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'DIRECT_EVIDENCE_WRITE';end if;
 denied:=false;begin perform public.save_project_review_flow(current_setting('training.production_actor')::uuid,current_setting('training.production_org')::uuid,null,0,'Denied RPC',true,100,'{}','[]');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'DIRECT_GRADING_RPC_ALLOWED';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009999',true);
do $$begin
 if exists(select 1 from public.learning_evidence_history where organization_id=current_setting('training.production_org')::uuid) or exists(select 1 from public.learning_project_review_flows where organization_id=current_setting('training.production_org')::uuid) then raise exception 'OUTSIDE_SCOPE_LEAK';end if;
end $$;
reset role;
rollback;
select jsonb_build_object('production_transaction_checks','passed','activities',(select count(*) from public.learning_activity_catalog),'profiles_by_position',(select count(*) from public.learning_job_profiles),'fixture_organizations_left',(select count(*) from public.organizations where name='VALIDATION ONLY production role-training rollback'),'submissions_left',(select count(*) from public.learning_practice_submissions),'evidence_left',(select count(*) from public.learning_evidence_history),'flows_left',(select count(*) from public.learning_project_review_flows),'profiles_unchanged',(select count(*) from public.profiles),'certificates_unchanged',(select count(*) from public.certificates)) verification;

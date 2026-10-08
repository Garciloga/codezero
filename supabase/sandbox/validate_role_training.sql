-- Only CodeZero Sandbox sdvwkrosdnlacyhnuxwo. Uses existing synthetic accounts.
-- All fixtures, positions, evidence and audit events roll back, including on failure.
begin;
do $$
declare org uuid; org2 uuid; a bigint; project bigint; request uuid:=gen_random_uuid(); result uuid; denied boolean; count_before integer;
 owner_id uuid:='10000000-0000-4000-8000-000000000001'; learner uuid:='10000000-0000-4000-8000-000000000002'; manager uuid:='10000000-0000-4000-8000-000000000003'; outsider uuid:='10000000-0000-4000-8000-000000000004';
 draft text:=repeat('Datos ficticios, observaciones verificables, decisión, responsable y siguiente comprobación. ',3);
begin
 if not exists(select 1 from public.profiles where id=owner_id and role='owner' and status='active') then raise exception 'EXPECTED_SANDBOX_FIXTURE';end if;
 org:=public.create_workspace_organization(owner_id,'VALIDATION ONLY role-training rollback');
 org2:=public.create_workspace_organization(owner_id,'VALIDATION ONLY isolated rollback');
 insert into public.organization_memberships(organization_id,user_id,display_name,role,reports_to,active) values(org,manager,'Synthetic manager','manager',owner_id,true),(org,learner,'Synthetic learner','learner',manager,true),(org2,outsider,'Synthetic outsider','learner',owner_id,true);
 perform public.rebuild_organization_access(org);perform public.rebuild_organization_access(org2);
 perform set_config('training.check_org',org::text,true);perform set_config('training.check_request',request::text,true);
 select id into a from public.learning_activity_catalog where content_key='common-communication';
 select id into project from public.learning_activity_catalog where content_key='cs-project-adoption';
 result:=public.submit_training_practice(learner,a,request,org,draft,'{"communication":3,"documentation":3}','guided','[0,0,0]','[1,1,1]');
 if result<>request then raise exception 'SUBMISSION_ID';end if;
 perform public.submit_training_practice(learner,a,request,org,draft,'{"communication":3,"documentation":3}','guided','[0,0,0]','[1,1,1]');
 if (select count(*) from public.learning_evidence_history where submission_id=request)<>4 then raise exception 'REPLAY_DUPLICATION';end if;
 denied:=false;begin perform public.submit_training_practice(learner,a,request,org,draft||'changed','{"communication":3,"documentation":3}','guided','[0,0,0]','[1,1,1]');exception when others then denied:=sqlerrm='REQUEST_CONFLICT';end;
 if not denied then raise exception 'REPLAY_CONFLICT_NOT_REJECTED';end if;
 denied:=false;begin perform public.submit_training_practice(outsider,a,gen_random_uuid(),org,draft,'{"communication":3,"documentation":3}','guided','[0,0,0]','[1,1,1]');exception when others then denied:=sqlerrm='FORBIDDEN';end;
 if not denied then raise exception 'CROSS_ORG_SUBMISSION';end if;
 perform public.set_training_position(manager,learner,org,'customer_success');
 perform public.assign_training_reinforcement(org,manager,learner,array[a],now()+interval '7 days','{"competencies":[{"key":"communication","level":1,"count":3}]}');
 result:=public.review_training_practice(manager,request,'{"communication":3,"documentation":3}','Verificación ficticia: evidencia clara, decisión justificable y siguiente paso comprobable.',array[]::text[],null,'independent');
 if (select review_source from public.learning_evidence_history where id=result)<>'manager' then raise exception 'MANAGER_REVIEW';end if;
 denied:=false;begin perform public.review_training_practice(manager,request,'{"communication":4,"documentation":4}','Corrección ficticia con suficiente longitud para comprobar versión.',array[]::text[],null,'independent');exception when others then denied:=sqlerrm='REVIEW_CONFLICT';end;
 if not denied then raise exception 'STALE_REVIEW';end if;
 denied:=false;begin perform public.submit_training_practice(learner,a,gen_random_uuid(),org,draft,'{"communication":3,"documentation":3}','independent','[0,0,0]','[1,1,1]',result);exception when others then denied:=true;end;
 if not denied then raise exception 'EARLY_RECHECK';end if;
 perform public.complete_training_reinforcement(manager,org,learner,a,'{"competencies":[{"key":"communication","level":3,"count":4}]}');
 if not exists(select 1 from public.learning_assignments where organization_id=org and user_id=learner and reinforcement_before is not null and reinforcement_after is not null and due_at is not null) then raise exception 'SNAPSHOTS';end if;
 result:=public.submit_training_practice(learner,project,gen_random_uuid(),org,draft,'{"data":3,"diagnosis":3,"planning":3}','independent','[]','[]');
 denied:=false;begin perform public.review_training_practice(manager,result,'{"data":3,"diagnosis":3,"planning":3}','Verificación ficticia suficientemente larga del proyecto.',array[]::text[],null,'independent');exception when others then denied:=sqlerrm='FORBIDDEN';end;
 if not denied then raise exception 'PROJECT_MANAGER_DENIAL';end if;
 denied:=false;begin perform public.issue_training_route_diploma(learner,org);exception when others then denied:=true;end;
 if not denied then raise exception 'UNQUALIFIED_DIPLOMA';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$declare denied boolean:=false;begin
 if (select count(*) from public.learning_evidence_history where organization_id=current_setting('training.check_org')::uuid)<5 then raise exception 'LEARNER_RLS';end if;
 begin perform public.set_training_position('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',null,'customer_success');exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'DIRECT_RPC_ALLOWED';end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$begin if (select count(*) from public.learning_evidence_history where organization_id=current_setting('training.check_org')::uuid)<5 then raise exception 'MANAGER_RLS';end if;end $$;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
do $$begin if exists(select 1 from public.learning_evidence_history where organization_id=current_setting('training.check_org')::uuid) then raise exception 'OUTSIDE_RLS_LEAK';end if;end $$;
reset role;
rollback;
select jsonb_build_object('cloud_transaction_checks','passed','fixture_organizations_left',(select count(*) from public.organizations where name like 'VALIDATION ONLY%rollback'),'evidence_left',(select count(*) from public.learning_evidence_history),'submissions_left',(select count(*) from public.learning_practice_submissions)) as verification;

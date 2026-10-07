-- Cloud PostgreSQL validation against synthetic fixtures only. Rolls back all test writes.
begin;
create temporary table sandbox_checks(name text primary key);
grant insert,select on sandbox_checks to authenticated,service_role;
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000004';
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}';
do $$ begin
if (select count(*) from public.organization_memberships)<>1 then raise exception 'Employee RLS failed';end if;
insert into sandbox_checks values('employee only own membership');
if has_function_privilege('authenticated','public.issue_workspace_diploma(uuid,integer)','execute') then raise exception 'Client diploma RPC exposed';end if;
insert into sandbox_checks values('diploma RPC denied to client');
if has_function_privilege('authenticated','public.create_workspace_organization(uuid,text)','execute') then raise exception 'Client organization RPC exposed';end if;
insert into sandbox_checks values('organization RPC denied to client');
end $$;
reset role;
do $$ declare org uuid; before_count integer; after_count integer; begin
select organization_id into org from public.organization_memberships where user_id='10000000-0000-4000-8000-000000000001';
select count(*) into before_count from codezero_private.organization_access where organization_id=org;
begin
perform public.update_workspace_member(org,'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','manager','10000000-0000-4000-8000-000000000003',true);
raise exception 'Cycle unexpectedly accepted' using errcode='ZZ001';
exception when raise_exception then if sqlerrm<>'HIERARCHY_CYCLE' then raise;end if;end;
select count(*) into after_count from codezero_private.organization_access where organization_id=org;
if before_count<>after_count then raise exception 'Non-atomic closure';end if;
insert into sandbox_checks values('hierarchy cycle rejected atomically');
begin
perform public.issue_workspace_diploma('10000000-0000-4000-8000-000000000004',1);
raise exception 'Incomplete diploma accepted' using errcode='ZZ001';
exception when raise_exception then if sqlerrm<>'BLOCK_INCOMPLETE' then raise;end if;end;
insert into sandbox_checks values('incomplete block cannot issue diploma');
insert into public.lesson_progress(user_id,lesson_id,status,progress_percent) values('10000000-0000-4000-8000-000000000004',1,'completed',100);
insert into public.exam_attempts(user_id,exam_id,score,passed) values('10000000-0000-4000-8000-000000000004',1,100,true);
perform public.issue_workspace_diploma('10000000-0000-4000-8000-000000000004',1);
perform public.issue_workspace_diploma('10000000-0000-4000-8000-000000000004',1);
if (select count(*) from public.issued_block_diplomas where user_id='10000000-0000-4000-8000-000000000004')<>1 then raise exception 'Diploma not idempotent';end if;
insert into sandbox_checks values('completed synthetic block issues exactly one diploma');
perform public.update_workspace_member(org,'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004','learner','10000000-0000-4000-8000-000000000003',false);
end $$;
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000004';
do $$ begin
if exists(select 1 from public.organization_memberships) then raise exception 'Revoked employee sees team';end if;
insert into sandbox_checks values('membership revocation removes team access immediately');
if (select count(*) from public.issued_block_diplomas)<>1 then raise exception 'Own diploma visibility failed';end if;
insert into sandbox_checks values('personal diploma preserved after team revocation');
end $$;
reset role;
update public.profiles set status='suspended' where id='10000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
set local request.jwt.claims='{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$ begin
if exists(select 1 from public.addons) then raise exception 'Suspended catalog visible';end if;
insert into sandbox_checks values('suspended user cannot access add-on catalogue');
begin
perform public.save_private_practice_progress('{"version":"samples-v1","role":"technical_cs","passed":[],"startDay":"","onboarding":[],"pulse":""}'::jsonb,0);
raise exception 'Suspended progress accepted' using errcode='ZZ001';
exception when insufficient_privilege then null;end;
insert into sandbox_checks values('suspended user cannot save practice');
end $$;
reset role;
select jsonb_build_object('passed',count(*),'checks',jsonb_agg(name order by name)) as validation from sandbox_checks;
rollback;

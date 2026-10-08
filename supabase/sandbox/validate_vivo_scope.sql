-- Run only in the authorized Supabase sandbox. Uses eight existing synthetic accounts.
-- This verifies hosted RLS in a rolled-back transaction; it does not log in through Auth.
begin;
create temporary table vivo_scope_results(role text,visible_count integer);
grant insert,select on vivo_scope_results to authenticated;
do $$
declare users uuid[];org uuid;inv uuid;actor uuid;roles text[]:=array['owner','admin','manager','manager','supervisor','learner','learner','learner'];parents integer[]:=array[null,1,1,1,3,5,4,3];n integer;actual integer;expected integer[]:=array[8,8,4,2,2,1,1,1];
begin
 select array_agg(id order by (role='owner') desc,id) into users from public.profiles where status='active' and id in(select id from auth.users where email like '%@codezero.example.test');
 if array_length(users,1)<>8 then raise exception 'EXPECTED_EIGHT_TEST_ACCOUNTS';end if;
 org:=public.create_workspace_organization(users[1],'Vivo QA transaccional');
 for n in 2..8 loop
 inv:=public.create_workspace_invitation(org,users[1],'vivoqa'||n||'@codezero.example.test',roles[n],users[parents[n]]);
 perform public.accept_workspace_invitation(inv,users[n],'vivoqa'||n||'@codezero.example.test','Persona QA '||n);
 end loop;
 for n in 1..8 loop
 perform set_config('request.jwt.claim.sub',users[n]::text,true);
 set local role authenticated;
 select count(*) into actual from public.organization_memberships where organization_id=org;
 insert into vivo_scope_results values(roles[n],actual);
 reset role;
 if actual<>expected[n] then raise exception 'SCOPE_MISMATCH % %',n,actual;end if;
 end loop;
end $$;
select * from vivo_scope_results;
rollback;

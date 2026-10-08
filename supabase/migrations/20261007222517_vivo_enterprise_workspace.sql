-- C · Vivo. Additive column; backend-only mutations and minimal directory.
alter table public.organization_memberships add column job_title text check (job_title is null or length(job_title)<=120);
create function public.update_workspace_member_details(p_org uuid,p_actor uuid,p_target uuid,p_role text,p_reports uuid,p_active boolean,p_job_title text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN'; end if;
 perform public.update_workspace_member(p_org,p_actor,p_target,p_role,p_reports,p_active);
 update public.organization_memberships set job_title=nullif(trim(p_job_title),'') where organization_id=p_org and user_id=p_target;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action) values(p_org,p_actor,p_target,'job_title_updated');
end $$;
create function public.workspace_directory(p_org uuid,p_actor uuid)
returns table(user_id uuid,display_name text,role text,reports_to uuid,active boolean,job_title text)
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join public.profiles p on p.id=m.user_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and p.status='active') then raise exception 'FORBIDDEN'; end if;
 return query select m.user_id,m.display_name,m.role,m.reports_to,m.active,m.job_title from public.organization_memberships m where m.organization_id=p_org and m.active order by m.display_name;
end $$;
create function public.workspace_current_levels(p_org uuid,p_actor uuid)
returns table(user_id uuid,current_level integer)
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active') or not exists(select 1 from codezero_private.organization_access where organization_id=p_org and viewer_id=p_actor) then raise exception 'FORBIDDEN'; end if;
 return query select a.target_id,coalesce((select min(n)::integer from generate_series(1,15) n where not exists(select 1 from public.exam_attempts e join public.level_exams x on x.id=e.exam_id join public.levels l on l.id=x.level_id where e.user_id=a.target_id and e.passed and l.level_number=n)),15) from codezero_private.organization_access a where a.organization_id=p_org and a.viewer_id=p_actor order by a.target_id;
end $$;
revoke all on function public.update_workspace_member_details(uuid,uuid,uuid,text,uuid,boolean,text),public.workspace_directory(uuid,uuid),public.workspace_current_levels(uuid,uuid) from public,anon,authenticated;
grant execute on function public.update_workspace_member_details(uuid,uuid,uuid,text,uuid,boolean,text),public.workspace_directory(uuid,uuid),public.workspace_current_levels(uuid,uuid) to service_role;
create or replace function public.assign_workspace_activity(p_org uuid,p_actor uuid,p_user uuid,p_type text,p_id bigint,p_competency text) returns void language plpgsql security invoker set search_path='' as $$
declare activity_title text;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found then raise exception 'ORGANIZATION_UNAVAILABLE'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin','manager','supervisor')) then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_user and active) then raise exception 'UNKNOWN_MEMBER'; end if;
 if not exists(select 1 from codezero_private.organization_access where organization_id=p_org and viewer_id=p_actor and target_id=p_user) or not exists(select 1 from public.profiles where id=p_actor and status='active') then raise exception 'FORBIDDEN'; end if;
 if p_type='lesson' then select title into activity_title from public.lessons where id=p_id and status='published';
 elsif p_type='exam' then select title into activity_title from public.level_exams where id=p_id and status='published';
 elsif p_type='project' then select title into activity_title from public.level_projects where id=p_id and status='published'; end if;
 if activity_title is null then raise exception 'INVALID_ACTIVITY'; end if;
 insert into public.learning_assignments(organization_id,user_id,activity_key,activity_type,activity_id,title,competency)
 values(p_org,p_user,p_type||':'||p_id::text,p_type,p_id,activity_title,p_competency) on conflict do nothing;
 insert into public.organization_audit_log(organization_id,actor_id,target_id,action,metadata) values(p_org,p_actor,p_user,'activity_assigned',jsonb_build_object('type',p_type,'id',p_id));
end $$;

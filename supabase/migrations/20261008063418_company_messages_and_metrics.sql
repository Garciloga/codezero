
begin;
create table public.organization_messages(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),team_id uuid,
 author_id uuid not null,body text not null check(length(body)<=4000),created_at timestamptz not null default now(),deleted_at timestamptz,
 request_id uuid not null,unique(organization_id,author_id,request_id),
 foreign key(organization_id,author_id) references public.organization_memberships(organization_id,user_id),
 foreign key(organization_id,team_id) references public.organization_teams(organization_id,id)
);
create index organization_messages_channel_idx on public.organization_messages(organization_id,team_id,created_at desc);
create function codezero_private.company_channel_access(p_org uuid,p_team uuid,p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.organization_memberships m join public.organizations o on o.id=m.organization_id join public.profiles p on p.id=m.user_id join public.organization_contracts c on c.organization_id=m.organization_id where m.organization_id=p_org and m.user_id=p_actor and m.active and o.active and p.status='active' and c.active and c.valid_until>now() and c.plan_name='enterprise'
 and (p_team is null or m.role in ('owner','admin') or exists(select 1 from public.organization_team_members t where t.organization_id=p_org and t.team_id=p_team and t.user_id=p_actor) or exists(select 1 from public.organization_team_grants g where g.organization_id=p_org and g.team_id=p_team and g.user_id=p_actor and g.can_view)))
 and (p_actor=auth.uid() or current_setting('role',true)='service_role')
$$;
revoke all on function codezero_private.company_channel_access(uuid,uuid,uuid) from public,anon;
grant execute on function codezero_private.company_channel_access(uuid,uuid,uuid) to authenticated,service_role;
alter table public.organization_messages enable row level security;
revoke all on public.organization_messages from public,anon,authenticated;grant select on public.organization_messages to authenticated;grant all on public.organization_messages to service_role;
create policy message_read on public.organization_messages for select to authenticated using(created_at>now()-interval '90 days' and codezero_private.company_channel_access(organization_id,team_id,(select auth.uid())));
create function public.send_company_message(p_org uuid,p_team uuid,p_actor uuid,p_request uuid,p_body text) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; existing text;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 if not found or not codezero_private.company_channel_access(p_org,p_team,p_actor) then raise exception 'FORBIDDEN';end if;
 if p_team is null and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin')) then raise exception 'ANNOUNCEMENT_PERMISSION';end if;
 -- Cross-team viewing is read-only, never an implicit posting grant.
 if p_team is not null and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin')) and not exists(select 1 from public.organization_team_members where organization_id=p_org and team_id=p_team and user_id=p_actor) then raise exception 'TEAM_POST_PERMISSION';end if;
 if length(trim(p_body))<1 or length(p_body)>4000 then raise exception 'INVALID_MESSAGE';end if;
 select id,body into result,existing from public.organization_messages where organization_id=p_org and author_id=p_actor and request_id=p_request;
 if result is not null then if existing<>trim(p_body) then raise exception 'REQUEST_CONFLICT';end if;return result;end if;
 insert into public.organization_messages(organization_id,team_id,author_id,request_id,body) values(p_org,p_team,p_actor,p_request,trim(p_body)) returning id into result;
 -- Bounded history for this tenant, including message bodies; not just a UI cutoff.
 delete from public.organization_messages where organization_id=p_org and created_at<=now()-interval '90 days';return result;
end $$;
create function public.remove_company_message(p_org uuid,p_actor uuid,p_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare msg public.organization_messages;
begin
 perform 1 from public.organizations where id=p_org and active for update;
 select * into msg from public.organization_messages where organization_id=p_org and id=p_id;
 if msg.id is null or not codezero_private.company_channel_access(p_org,msg.team_id,p_actor) or (msg.author_id<>p_actor and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=p_actor and active and role in ('owner','admin'))) then raise exception 'FORBIDDEN';end if;
 update public.organization_messages set body='',deleted_at=now() where id=p_id;
 insert into public.organization_audit_log(organization_id,actor_id,action,metadata) values(p_org,p_actor,'message_removed',jsonb_build_object('message',p_id));
end $$;
revoke all on function public.send_company_message(uuid,uuid,uuid,uuid,text),public.remove_company_message(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.send_company_message(uuid,uuid,uuid,uuid,text),public.remove_company_message(uuid,uuid,uuid) to service_role;

-- Anonymous aggregate analytics: no identity, email, IP, referrer, URL query or cookies.
create table public.site_daily_metrics(day date not null default current_date,page_key text not null check(page_key in ('home','pricing','registration','roadmap')),visits bigint not null default 0,primary key(day,page_key));
alter table public.site_daily_metrics enable row level security;
revoke all on public.site_daily_metrics from public,anon,authenticated;grant all on public.site_daily_metrics to service_role;
create function public.record_site_visit(p_page text) returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.site_daily_metrics(day,page_key,visits) values(current_date,p_page,1) on conflict(day,page_key) do update set visits=public.site_daily_metrics.visits+1;
 delete from public.site_daily_metrics where day<current_date-90;
end $$;
revoke all on function public.record_site_visit(text) from public,anon,authenticated;grant execute on function public.record_site_visit(text) to service_role;

create table public.account_cancellation_history(
 event_id text primary key references public.stripe_webhook_events(event_id),user_id uuid not null references auth.users(id),
 subscription_id text not null,action text not null check(action in ('scheduled','reversed','ended')),occurred_at timestamptz not null
);
create index cancellation_history_user_idx on public.account_cancellation_history(user_id,occurred_at desc);
alter table public.account_cancellation_history enable row level security;
revoke all on public.account_cancellation_history from public,anon,authenticated;grant select on public.account_cancellation_history to authenticated;grant all on public.account_cancellation_history to service_role;
create policy cancellation_own on public.account_cancellation_history for select to authenticated using(user_id=(select auth.uid()));
create or replace view public.account_entitlements with(security_invoker=true) as
 select p.id user_id,codezero_private.effective_learning_plan(p.id) plan_name,coalesce(pl.exercise_limit,20) exercise_limit,coalesce(pl.exam_limit,1) exam_limit,
 case when p.plan_name='pro' or exists(select 1 from public.account_addons aa where aa.user_id=p.id and aa.addon_key='ai_tutor' and aa.status='active') then 100 else 0 end ai_query_limit,
 coalesce(pl.project_limit,1) project_limit,
 jsonb_build_object('exercises',coalesce(u.exercises,0),'exams',coalesce(u.exams,0),'ai_queries',coalesce(u.ai_queries,0),'projects',coalesce(u.projects,0)) usage
 from public.profiles p left join public.plans pl on pl.name=codezero_private.effective_learning_plan(p.id) left join public.usage_monthly u on u.user_id=p.id and u.period_start=date_trunc('month',now())::date;
-- Existing public policy function remains tied to the verified caller; new helper is private.
create or replace function public.can_read_level(p_level_id bigint) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join public.levels lv on lv.id=p_level_id where p.id=auth.uid() and p.status='active' and (p.role in ('owner','admin') or codezero_private.effective_learning_plan(p.id) in ('starter','pro','enterprise') or lv.level_number=1))
$$;
commit;

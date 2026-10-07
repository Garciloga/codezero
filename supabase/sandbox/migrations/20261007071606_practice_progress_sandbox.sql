-- TEST ONLY. Apply after enterprise_workspace_sandbox in the approved isolated database.
-- Private learner self-checks; never read by official grading, quotas or diploma issuance.
create table public.private_practice_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 progress jsonb not null,
 revision integer not null default 1 check(revision > 0),
 updated_at timestamptz not null default now(),
 constraint bounded_private_progress check (
  jsonb_typeof(progress) = 'object' and octet_length(progress::text) <= 4000
  and progress ?& array['version','role','passed','startDay','onboarding','pulse']
  and progress - array['version','role','passed','startDay','onboarding','pulse'] = '{}'::jsonb
  and jsonb_typeof(progress->'version') = 'string' and progress->>'version' = 'samples-v1'
  and jsonb_typeof(progress->'role') = 'string' and progress->>'role' in ('technical_cs','support','integrations')
  and jsonb_typeof(progress->'passed') = 'array' and jsonb_array_length(progress->'passed') <= 11
  and progress->'passed' <@ '["handoff","python-output","python-error","sql-filter","support-note","safe-webhook","api-11","api-12","api-13","api-14","api-15"]'::jsonb
  and jsonb_typeof(progress->'onboarding') = 'array' and jsonb_array_length(progress->'onboarding') <= 7
  and progress->'onboarding' <@ '[0,1,2,3,4,5,6]'::jsonb
  and jsonb_typeof(progress->'pulse') = 'string' and length(progress->>'pulse') <= 500
  and jsonb_typeof(progress->'startDay') = 'string'
  and (progress->>'startDay' = '' or progress->>'startDay' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$')
 )
);
alter table public.private_practice_progress enable row level security;
revoke all on public.private_practice_progress from public, anon, authenticated;
grant select, insert, update on public.private_practice_progress to authenticated;
create policy private_practice_read on public.private_practice_progress for select to authenticated
using (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy private_practice_insert on public.private_practice_progress for insert to authenticated
with check (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy private_practice_update on public.private_practice_progress for update to authenticated
using (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'))
with check (user_id = (select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));

create function public.save_private_practice_progress(p_progress jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare actor uuid := auth.uid(); current_revision integer; next_revision integer;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and status='active') then
  raise exception 'Active user required' using errcode='42501';
 end if;
 if p_revision is null or p_revision < 0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 -- One advisory lock per user makes first inserts and competing saves atomic.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('private-practice:'||actor::text,0));
 select revision into current_revision from public.private_practice_progress where user_id=actor for update;
 if coalesce(current_revision,0) <> p_revision then raise exception 'Progress changed in another tab' using errcode='40001'; end if;
 if current_revision is null then
  insert into public.private_practice_progress(user_id,progress) values(actor,p_progress) returning revision into next_revision;
 else
  update public.private_practice_progress set progress=p_progress,revision=current_revision+1,updated_at=now()
  where user_id=actor returning revision into next_revision;
 end if;
 return next_revision;
end $$;
revoke all on function public.save_private_practice_progress(jsonb,integer) from public,anon;
grant execute on function public.save_private_practice_progress(jsonb,integer) to authenticated;

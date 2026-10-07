-- Enforce commercial plan access at the database read layer.
-- Free users may read Level 1 only; active paid users and owner/admin may read all levels.

create or replace function public.can_read_level(p_level_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.levels lv on lv.id = p_level_id
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role in ('owner','admin')
        or p.plan_name in ('starter','pro','enterprise')
        or lv.level_number = 1
      )
  );
$$;

revoke all on function public.can_read_level(bigint) from public, anon;
grant execute on function public.can_read_level(bigint) to authenticated, service_role;

drop policy if exists "Authenticated users can read levels" on public.levels;
create policy "Users can read entitled levels"
on public.levels for select
to authenticated
using (status = 'published' and public.can_read_level(id));

drop policy if exists "Authenticated users can read lessons" on public.lessons;
create policy "Users can read entitled lessons"
on public.lessons for select
to authenticated
using (status = 'published' and public.can_read_level(level_id));

drop policy if exists "Authenticated users can read exercises" on public.exercises;
create policy "Users can read entitled exercises"
on public.exercises for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.lessons l
    where l.id = exercises.lesson_id
      and public.can_read_level(l.level_id)
  )
);

drop policy if exists "Authenticated users can read level exams" on public.level_exams;
create policy "Users can read entitled exams"
on public.level_exams for select
to authenticated
using (status = 'published' and public.can_read_level(level_id));

drop policy if exists "Authenticated users can read exam questions" on public.exam_questions;
create policy "Users can read entitled exam questions"
on public.exam_questions for select
to authenticated
using (
  exists (
    select 1
    from public.level_exams e
    where e.id = exam_questions.exam_id
      and e.status = 'published'
      and public.can_read_level(e.level_id)
  )
);

drop policy if exists "Authenticated users can read level projects" on public.level_projects;
create policy "Users can read entitled projects"
on public.level_projects for select
to authenticated
using (status = 'published' and public.can_read_level(level_id));

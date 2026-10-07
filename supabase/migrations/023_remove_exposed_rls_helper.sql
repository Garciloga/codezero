-- Remove exposed SECURITY DEFINER dependency from curriculum RLS.
-- Entitlement filtering is expressed through RLS-aware subqueries instead.

alter policy "Users can read entitled levels"
on public.levels
using (
  status = 'published'
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'
      and (
        p.role in ('owner','admin')
        or p.plan_name in ('starter','pro','enterprise')
        or levels.level_number = 1
      )
  )
);

alter policy "Users can read entitled lessons"
on public.lessons
using (
  status = 'published'
  and exists (
    select 1 from public.levels lv
    where lv.id = lessons.level_id
  )
);

alter policy "Users can read entitled exercises"
on public.exercises
using (
  status = 'published'
  and exists (
    select 1
    from public.lessons l
    where l.id = exercises.lesson_id
  )
);

alter policy "Users can read entitled exams"
on public.level_exams
using (
  status = 'published'
  and exists (
    select 1 from public.levels lv
    where lv.id = level_exams.level_id
  )
);

alter policy "Users can read entitled exam questions"
on public.exam_questions
using (
  exists (
    select 1
    from public.level_exams e
    where e.id = exam_questions.exam_id
  )
);

alter policy "Users can read entitled projects"
on public.level_projects
using (
  status = 'published'
  and exists (
    select 1 from public.levels lv
    where lv.id = level_projects.level_id
  )
);

revoke execute on function public.can_read_level(bigint) from authenticated, service_role;

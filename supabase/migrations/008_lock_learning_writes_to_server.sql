drop policy if exists "users update own profile" on public.profiles;
revoke update on public.profiles from authenticated;

drop policy if exists "users write own progress" on public.progress;
drop policy if exists "users update own progress" on public.progress;
revoke insert, update, delete on public.progress from authenticated;

drop policy if exists "Users can create own lesson progress" on public.lesson_progress;
drop policy if exists "Users can update own lesson progress" on public.lesson_progress;
revoke insert, update, delete on public.lesson_progress from authenticated;

drop policy if exists "Users can create own exercise attempts" on public.exercise_attempts;
revoke insert, update, delete on public.exercise_attempts from authenticated;

drop policy if exists "Users can create own exam attempts" on public.exam_attempts;
revoke insert, update, delete on public.exam_attempts from authenticated;

drop policy if exists "Users can create own project submissions" on public.project_submissions;
drop policy if exists "Users can update own project submissions" on public.project_submissions;
revoke insert, update, delete on public.project_submissions from authenticated;

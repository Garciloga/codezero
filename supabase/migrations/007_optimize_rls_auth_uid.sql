drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "users read own usage" on public.usage_monthly;
create policy "users read own usage" on public.usage_monthly
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "users read own progress" on public.progress;
create policy "users read own progress" on public.progress
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "users write own progress" on public.progress;
create policy "users write own progress" on public.progress
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "users update own progress" on public.progress;
create policy "users update own progress" on public.progress
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own lesson progress" on public.lesson_progress;
create policy "Users can read own lesson progress" on public.lesson_progress
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can create own lesson progress" on public.lesson_progress;
create policy "Users can create own lesson progress" on public.lesson_progress
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own lesson progress" on public.lesson_progress;
create policy "Users can update own lesson progress" on public.lesson_progress
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own exercise attempts" on public.exercise_attempts;
create policy "Users can read own exercise attempts" on public.exercise_attempts
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can create own exercise attempts" on public.exercise_attempts;
create policy "Users can create own exercise attempts" on public.exercise_attempts
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own exam attempts" on public.exam_attempts;
create policy "Users can read own exam attempts" on public.exam_attempts
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can create own exam attempts" on public.exam_attempts;
create policy "Users can create own exam attempts" on public.exam_attempts
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own project submissions" on public.project_submissions;
create policy "Users can read own project submissions" on public.project_submissions
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users can create own project submissions" on public.project_submissions;
create policy "Users can create own project submissions" on public.project_submissions
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own project submissions" on public.project_submissions;
create policy "Users can update own project submissions" on public.project_submissions
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

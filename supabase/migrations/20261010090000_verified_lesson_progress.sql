-- Verified lesson progress. Additive and reversible; no existing row is rewritten.
-- Rollback: alter table public.lesson_progress drop column verified_at;
--           alter table public.exercise_attempts drop column category;
--
-- verified_at: set only when the server confirmed every published activity of the
-- lesson was answered correctly before completion. Rows completed before this
-- migration keep verified_at null and remain valid as historical progress.
alter table public.lesson_progress add column if not exists verified_at timestamptz;
comment on column public.lesson_progress.verified_at is 'Server-verified completion time; null means historical completion kept as is.';

-- category: 'lesson_check' is the free minimum check of a lesson (an activity the
-- learner has not passed yet); 'practice' is extra practice and stays metered by
-- the existing exercises quota. Quota limits themselves are unchanged.
alter table public.exercise_attempts add column if not exists category text not null default 'practice';
do $$begin
 if not exists(select 1 from pg_constraint where conname='exercise_attempts_category_check') then
  alter table public.exercise_attempts add constraint exercise_attempts_category_check check (category in ('practice','lesson_check'));
 end if;
end$$;
comment on column public.exercise_attempts.category is 'lesson_check = free mandatory check; practice = metered extra practice.';

-- CodeZero production integrity hardening
-- Non-destructive CHECK constraints for values already enforced by application logic.

alter table public.profiles
  add constraint profiles_plan_name_check
  check (plan_name in ('free','starter','pro','enterprise'));

alter table public.profiles
  add constraint profiles_billing_status_check
  check (
    billing_status is null or billing_status in (
      'active','trialing','past_due','canceled','unpaid',
      'incomplete','incomplete_expired','paused'
    )
  );

alter table public.usage_monthly
  add constraint usage_monthly_nonnegative_check
  check (exercises >= 0 and exams >= 0 and ai_queries >= 0 and projects >= 0);

alter table public.exam_attempts
  add constraint exam_attempts_score_check
  check (score >= 0 and score <= 100);

alter table public.project_submissions
  add constraint project_submissions_score_check
  check (score is null or (score >= 0 and score <= 100));

alter table public.project_submissions
  add constraint project_submissions_status_check
  check (status in ('submitted','needs_revision','approved'));

alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_status_check
  check (status in ('processing','processed','failed'));

alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_attempts_check
  check (attempts >= 1);

alter table public.level_exams
  add constraint level_exams_passing_score_check
  check (passing_score >= 0 and passing_score <= 100);

alter table public.level_exams
  add constraint level_exams_question_count_check
  check (question_count > 0);

alter table public.lessons
  add constraint lessons_estimated_minutes_check
  check (estimated_minutes > 0);

alter table public.levels
  add constraint levels_estimated_hours_check
  check (estimated_hours >= 0);

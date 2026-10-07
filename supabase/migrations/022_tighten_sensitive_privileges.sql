-- Reduce direct database privileges for server-only and read-only resources.

revoke all on table public.exercise_solutions from anon, authenticated;
revoke all on table public.exam_solutions from anon, authenticated;
revoke all on table public.stripe_webhook_events from anon, authenticated;

grant select, insert, update, delete on table public.exercise_solutions to service_role;
grant select, insert, update, delete on table public.exam_solutions to service_role;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;

revoke all on table public.account_entitlements from anon;
revoke insert, update, delete, truncate, references, trigger on table public.account_entitlements from authenticated;
grant select on table public.account_entitlements to authenticated, service_role;

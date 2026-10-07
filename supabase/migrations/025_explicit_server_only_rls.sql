-- Explicit deny-all RLS policies document server-only tables and quiet no-policy advisories.

create policy "No client access to exercise solutions"
on public.exercise_solutions
for all
to anon, authenticated
using (false)
with check (false);

create policy "No client access to exam solutions"
on public.exam_solutions
for all
to anon, authenticated
using (false)
with check (false);

create policy "No client access to Stripe webhook events"
on public.stripe_webhook_events
for all
to anon, authenticated
using (false)
with check (false);

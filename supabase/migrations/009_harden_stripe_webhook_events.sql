alter table public.stripe_webhook_events
  add column if not exists status text not null default 'processed',
  add column if not exists attempts integer not null default 1,
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.stripe_webhook_events
  alter column processed_at drop not null,
  alter column processed_at drop default;

update public.stripe_webhook_events
set status = coalesce(status, 'processed'),
    attempts = greatest(coalesce(attempts, 1), 1),
    updated_at = coalesce(updated_at, processed_at, now())
where true;

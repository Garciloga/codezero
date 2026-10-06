alter table public.profiles
  add column if not exists billing_status text,
  add column if not exists stripe_cancel_at_period_end boolean not null default false;

revoke execute on function public.consume_quota(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.consume_quota(uuid,text,integer) to service_role;

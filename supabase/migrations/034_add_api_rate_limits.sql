create table if not exists public.api_rate_limits (
  bucket_key text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (bucket_key, bucket_start)
);

alter table public.api_rate_limits enable row level security;

create policy "No client access to api rate limits"
on public.api_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

revoke all on table public.api_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket_start timestamptz;
  v_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'not authorized';
  end if;

  if p_bucket_key is null or length(p_bucket_key) < 3 or p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'invalid arguments';
  end if;

  v_bucket_start :=
    to_timestamp(
      floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
    );

  insert into public.api_rate_limits(bucket_key, bucket_start, request_count)
  values (p_bucket_key, v_bucket_start, 1)
  on conflict (bucket_key, bucket_start)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;

  delete from public.api_rate_limits
  where bucket_start < now() - interval '2 days';

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'count', v_count,
    'limit', p_limit,
    'retry_after_seconds',
      case
        when v_count <= p_limit then 0
        else greatest(
          1,
          ceil(
            extract(
              epoch from (
                v_bucket_start + make_interval(secs => p_window_seconds) - now()
              )
            )
          )::integer
        )
      end
  );
end;
$$;

revoke all on function public.consume_api_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,integer,integer) to service_role;

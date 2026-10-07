-- Make metered quota RPCs explicitly server-only and support rollback on provider/internal failure.

create or replace function public.consume_quota(
  p_user_id uuid,
  p_metric text,
  p_amount integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used integer;
  max_allowed integer;
  new_used integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'not authorized';
  end if;

  if p_user_id is null or p_amount <= 0 then
    raise exception 'invalid arguments';
  end if;

  select case p_metric
    when 'exercises' then exercise_limit
    when 'exams' then exam_limit
    when 'ai_queries' then ai_query_limit
    when 'projects' then project_limit
    else null
  end
  into max_allowed
  from public.account_entitlements
  where user_id = p_user_id;

  if max_allowed is null then
    raise exception 'invalid metric or entitlement';
  end if;

  insert into public.usage_monthly(user_id, period_start)
  values (p_user_id, date_trunc('month', now())::date)
  on conflict do nothing;

  execute format(
    'select %I from public.usage_monthly where user_id=$1 and period_start=date_trunc(''month'',now())::date for update',
    p_metric
  )
  into current_used
  using p_user_id;

  if max_allowed >= 0 and current_used + p_amount > max_allowed then
    return jsonb_build_object(
      'allowed', false,
      'used', current_used,
      'limit', max_allowed,
      'remaining', greatest(0, max_allowed-current_used)
    );
  end if;

  execute format(
    'update public.usage_monthly set %I=%I+$1 where user_id=$2 and period_start=date_trunc(''month'',now())::date',
    p_metric, p_metric
  )
  using p_amount, p_user_id;

  new_used := current_used + p_amount;

  return jsonb_build_object(
    'allowed', true,
    'used', new_used,
    'limit', max_allowed,
    'remaining', case when max_allowed < 0 then -1 else max_allowed-new_used end
  );
end;
$$;

create or replace function public.release_quota(
  p_user_id uuid,
  p_metric text,
  p_amount integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'not authorized';
  end if;

  if p_user_id is null or p_amount <= 0 or p_metric not in ('exercises','exams','ai_queries','projects') then
    raise exception 'invalid arguments';
  end if;

  execute format(
    'update public.usage_monthly
     set %I=greatest(0,%I-$1)
     where user_id=$2 and period_start=date_trunc(''month'',now())::date',
    p_metric, p_metric
  )
  using p_amount, p_user_id;
end;
$$;

revoke all on function public.consume_quota(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.consume_quota(uuid,text,integer) to service_role;

revoke all on function public.release_quota(uuid,text,integer) from public, anon, authenticated;
grant execute on function public.release_quota(uuid,text,integer) to service_role;

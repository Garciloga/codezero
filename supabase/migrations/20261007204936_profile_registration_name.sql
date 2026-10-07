-- Informational metadata only. Roles, plans, quotas and certificates are not changed.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile_name text;
begin
  if jsonb_typeof(new.raw_user_meta_data->'full_name') = 'string' then
    profile_name := trim(new.raw_user_meta_data->>'full_name');
    if length(profile_name) not between 2 and 100 then profile_name := null; end if;
  end if;
  insert into public.profiles(id,email,full_name) values(new.id,new.email,profile_name);
  insert into public.usage_monthly(user_id,period_start)
  values(new.id,date_trunc('month',now())::date);
  return new;
end;
$$;
-- Repair missing profile names without replacing names deliberately edited in the profile.
update public.profiles p set full_name = trim(u.raw_user_meta_data->>'full_name')
from auth.users u where p.id = u.id and nullif(trim(p.full_name),'') is null
and jsonb_typeof(u.raw_user_meta_data->'full_name') = 'string'
and length(trim(u.raw_user_meta_data->>'full_name')) between 2 and 100;

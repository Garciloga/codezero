-- Pin the one existing platform owner. Organization roles remain independent.
do $$ begin
 if (select count(*) from public.profiles where role='owner')<>1 then raise exception 'EXPECTED_ONE_PLATFORM_OWNER';end if;
end $$;
create table codezero_private.platform_owner (
 singleton boolean primary key default true check(singleton),
 user_id uuid not null unique
);
insert into codezero_private.platform_owner(user_id) select id from public.profiles where role='owner';
alter table codezero_private.platform_owner enable row level security;
revoke all on codezero_private.platform_owner from public,anon,authenticated,service_role;
grant select on codezero_private.platform_owner to service_role;
create unique index profiles_one_platform_owner on public.profiles((true)) where role='owner';
create function codezero_private.protect_platform_owner() returns trigger language plpgsql set search_path='' as $$
declare designated uuid;
begin
 select user_id into designated from codezero_private.platform_owner where singleton;
 if tg_op='DELETE' then
  if old.id=designated then raise exception 'PLATFORM_OWNER_IMMUTABLE';end if;return old;
 end if;
 if new.role='owner' and new.id<>designated then raise exception 'ONE_PLATFORM_OWNER_ONLY';end if;
 if new.id=designated and (new.role<>'owner' or new.status<>'active') then raise exception 'PLATFORM_OWNER_IMMUTABLE';end if;
 return new;
end $$;
create trigger protect_platform_owner before insert or update or delete on public.profiles for each row execute function codezero_private.protect_platform_owner();
create function codezero_private.exclude_platform_owner_member() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from public.profiles where id=new.user_id and role='owner') then raise exception 'PLATFORM_OWNER_PRIVATE';end if;return new;
end $$;
create trigger exclude_platform_owner_member before insert or update on public.organization_memberships for each row execute function codezero_private.exclude_platform_owner_member();
-- The platform operator identity is private; company clients need only display fields.
revoke select on public.organization_contracts,public.organization_audit_log,public.organization_invitations from public,anon,authenticated;
grant select(organization_id,reference,seat_limit,plan_name,valid_until,active,updated_at) on public.organization_contracts to authenticated;
grant select(id,organization_id,action,created_at) on public.organization_audit_log to authenticated;
grant select(id,organization_id,email,role,reports_to,expires_at,accepted_user_id,accepted_at,team_id,revoked_at,email_status) on public.organization_invitations to authenticated;
-- Functions used in existing RLS evaluate inviter identity internally; callers
-- cannot read the operator ID directly through Data API column selection.
create function public.owner_grant_user_access(p_actor uuid,p_target uuid,p_name text,p_plan text) returns void language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='owner' and status='active') then raise exception 'FORBIDDEN';end if;
 if p_plan not in ('free','starter','pro','enterprise') or length(trim(p_name)) not between 2 and 100 then raise exception 'INVALID_ACCESS';end if;
 if not exists(select 1 from public.profiles where id=p_target and role='student' and stripe_subscription_id is null) then raise exception 'INVALID_TARGET';end if;
 update public.profiles set full_name=trim(p_name),plan_name=p_plan,status='active',updated_at=now() where id=p_target;
 insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata) values(p_actor,'owner_user_created','profile',p_target::text,jsonb_build_object('plan_name',p_plan,'payment','manual_no_charge'));
end $$;
revoke all on function public.owner_grant_user_access(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.owner_grant_user_access(uuid,uuid,text,text) to service_role;

create table public.company_seat_orders (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id),
 organization_id uuid unique references public.organizations(id),
 company_name text not null check(length(company_name) between 2 and 120),
 plan_name text not null check(plan_name in ('starter','pro')),
 requested_seats integer not null check(requested_seats between 5 and 100000),
 stripe_subscription_id text unique,
 stripe_customer_id text,
 status text not null default 'pending' check(status in ('pending','active','inactive')),
 permissions_acknowledged_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.company_seat_orders enable row level security;
revoke all on public.company_seat_orders from public,anon,authenticated;
grant select on public.company_seat_orders to authenticated;
grant all on public.company_seat_orders to service_role;
create policy seat_orders_own on public.company_seat_orders for select to authenticated using(requester_id=(select auth.uid()));
create index company_seat_orders_requester on public.company_seat_orders(requester_id);
create function public.sync_company_seat_subscription(p_order uuid,p_subscription text,p_customer text,p_plan text,p_seats integer,p_until timestamptz,p_active boolean,p_paid boolean) returns uuid language plpgsql set search_path='' as $$
declare order_row public.company_seat_orders;org uuid;person public.profiles;
begin
 select * into order_row from public.company_seat_orders where id=p_order for update;
 if order_row.id is null or order_row.stripe_customer_id is not null and order_row.stripe_customer_id<>p_customer or order_row.stripe_subscription_id is not null and order_row.stripe_subscription_id<>p_subscription then raise exception 'INVALID_ORDER';end if;
 if p_plan is null or p_seats is null or p_until is null or p_active is null or p_paid is null or p_plan not in ('starter','pro') or p_seats<5 or p_seats>100000 or p_subscription is null or p_customer is null then raise exception 'INVALID_SEATS';end if;
 select * into person from public.profiles where id=order_row.requester_id;
 if person.id is null or person.role='owner' or person.status<>'active' or codezero_private.company_verified_email(person.id) is null then raise exception 'INVALID_RESPONSIBLE';end if;
 org=order_row.organization_id;
 if org is null then
  if not p_active or not p_paid or p_until<=now() or p_plan<>order_row.plan_name or p_seats<>order_row.requested_seats then return null;end if;
  insert into public.organizations(name) values(order_row.company_name) returning id into org;
  insert into public.organization_contracts(organization_id,reference,seat_limit,plan_name,valid_until,active,recorded_by)
  values(org,p_subscription,p_seats,p_plan,p_until,true,person.id);
  insert into public.organization_memberships(organization_id,user_id,display_name,role) values(org,person.id,coalesce(nullif(person.full_name,''),'Responsable'),'owner');
  perform public.rebuild_organization_access(org);
 end if;
 perform 1 from public.organizations where id=org for update;
 if p_active and public.company_seat_usage(org)>p_seats then raise exception 'SEATS_BELOW_USAGE';end if;
 insert into public.organization_contracts(organization_id,reference,seat_limit,plan_name,valid_until,active,recorded_by)
 values(org,p_subscription,p_seats,p_plan,p_until,p_active and p_paid,person.id)
 on conflict(organization_id) do update set seat_limit=excluded.seat_limit,plan_name=excluded.plan_name,
 valid_until=case when excluded.active then excluded.valid_until else public.organization_contracts.valid_until end,
 active=excluded.active,updated_at=now();
 update public.company_seat_orders set organization_id=org,stripe_subscription_id=p_subscription,stripe_customer_id=p_customer,status=case when p_active and p_paid then 'active' else 'inactive' end,updated_at=now() where id=p_order;
 return org;
end $$;
revoke all on function public.sync_company_seat_subscription(uuid,text,text,text,integer,timestamptz,boolean,boolean) from public,anon,authenticated;
grant execute on function public.sync_company_seat_subscription(uuid,text,text,text,integer,timestamptz,boolean,boolean) to service_role;

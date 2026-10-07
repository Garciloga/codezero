-- Additive release: private execution ledger, consented certificate sharing and per-sitting exams.
create table public.certificate_publications (
 certificate_id uuid primary key references public.certificates(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 public_id text not null unique check(public_id ~ '^[a-f0-9]{64}$'),
 display_name text not null check(length(trim(display_name)) between 1 and 160),
 title text not null check(length(title) between 1 and 160),
 issued_on date not null, status text not null check(status in ('verified','revoked')),
 consented_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index certificate_publications_user_idx on public.certificate_publications(user_id);
alter table public.certificate_publications enable row level security;
revoke all on public.certificate_publications from anon,authenticated;
grant select on public.certificate_publications to authenticated;
grant all on public.certificate_publications to service_role;
create policy publications_owner on public.certificate_publications for select to authenticated using(user_id=(select auth.uid()));
create table public.exam_sittings (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 exam_id bigint not null references public.level_exams(id) on delete cascade,
 variant jsonb not null check(jsonb_typeof(variant)='object'),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '2 hours',
 attempt_id bigint references public.exam_attempts(id), submitted_at timestamptz
);
create index exam_sittings_user_idx on public.exam_sittings(user_id,exam_id,created_at);
create index exam_sittings_attempt_idx on public.exam_sittings(attempt_id);
create index exam_sittings_exam_idx on public.exam_sittings(exam_id);
alter table public.exam_sittings enable row level security;
revoke all on public.exam_sittings from anon,authenticated;
grant all on public.exam_sittings to service_role;
create function public.finish_exam_sitting(p_user uuid,p_sitting uuid,p_score integer,p_passed boolean,p_answers jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.exam_sittings; a bigint; q jsonb;
begin
 select * into s from public.exam_sittings where id=p_sitting and user_id=p_user for update;
 if not found then raise exception 'SITTING_UNAVAILABLE'; end if;
 if s.attempt_id is not null then return jsonb_build_object('status','replay','attempt_id',s.attempt_id); end if;
 if s.expires_at<now() then raise exception 'SITTING_EXPIRED'; end if;
 if p_score not between 0 and 100 or p_passed is null or jsonb_typeof(p_answers)<>'object' then raise exception 'INVALID_SCORE'; end if;
 q:=public.consume_quota(p_user,'exams',1);
 if not (q->>'allowed')::boolean then return jsonb_build_object('status','limit'); end if;
 insert into public.exam_attempts(user_id,exam_id,score,passed,answers) values(p_user,s.exam_id,p_score,p_passed,p_answers) returning id into a;
 update public.exam_sittings set attempt_id=a,submitted_at=now() where id=s.id;
 return jsonb_build_object('status','submitted','attempt_id',a);
end $$;
revoke all on function public.finish_exam_sitting(uuid,uuid,integer,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.finish_exam_sitting(uuid,uuid,integer,boolean,jsonb) to service_role;
create table public.tutor_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 period_start date not null, request_id uuid not null, fingerprint text not null,
 state text not null check(state in ('reserved','dispatched','settled','uncertain')),
 bound_micro_usd integer not null check(bound_micro_usd between 1 and 50000),
 actual_micro_usd bigint check(actual_micro_usd>=0),created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),primary key(user_id,period_start,request_id)
);
alter table public.tutor_requests enable row level security;
revoke all on public.tutor_requests from anon,authenticated;
grant all on public.tutor_requests to service_role;
create function public.reserve_tutor_request(p_user uuid,p_request uuid,p_fingerprint text,p_bound integer)
returns text language plpgsql security invoker set search_path='' as $$
declare period date:=date_trunc('month',now())::date; r public.tutor_requests; used bigint; q jsonb;
begin
 if p_bound not between 1 and 50000 or length(p_fingerprint)<>64 then raise exception 'INVALID_RESERVATION'; end if;
 perform pg_advisory_xact_lock(hashtextextended('tutor:'||p_user::text,0));
 select * into r from public.tutor_requests where user_id=p_user and period_start=period and request_id=p_request;
 if found then
  if r.fingerprint<>p_fingerprint then raise exception 'REQUEST_REUSE'; end if;
  return 'replay';
 end if;
 -- Unknown cost remains reserved; no second provider dispatch until reconciled.
 if exists(select 1 from public.tutor_requests where user_id=p_user and period_start=period and (state='uncertain' or (state='dispatched' and updated_at<now()-interval '1 minute'))) then raise exception 'RECONCILIATION_REQUIRED'; end if;
 select coalesce(sum(coalesce(actual_micro_usd,bound_micro_usd)),0) into used from public.tutor_requests where user_id=p_user and period_start=period;
 if used+p_bound>2000000 then raise exception 'BUDGET_LIMIT'; end if;
 q:=public.consume_quota(p_user,'ai_queries',1);
 if not (q->>'allowed')::boolean then raise exception 'AI_QUERY_LIMIT_REACHED'; end if;
 insert into public.tutor_requests(user_id,period_start,request_id,fingerprint,state,bound_micro_usd) values(p_user,period,p_request,p_fingerprint,'reserved',p_bound);
 return 'reserved';
end $$;
revoke all on function public.reserve_tutor_request(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.reserve_tutor_request(uuid,uuid,text,integer) to service_role;
-- Pro includes the Tutor; all pre-existing exercise, exam and project limits stay unchanged.
create or replace view public.account_entitlements with(security_invoker=true) as
 select p.id user_id,p.plan_name,coalesce(pl.exercise_limit,20) exercise_limit,coalesce(pl.exam_limit,1) exam_limit,
 case when p.plan_name='pro' or exists(select 1 from public.account_addons aa where aa.user_id=p.id and aa.addon_key='ai_tutor' and aa.status='active') then 100 else 0 end ai_query_limit,
 coalesce(pl.project_limit,1) project_limit,
 jsonb_build_object('exercises',coalesce(u.exercises,0),'exams',coalesce(u.exams,0),'ai_queries',coalesce(u.ai_queries,0),'projects',coalesce(u.projects,0)) usage
 from public.profiles p left join public.plans pl on pl.name=p.plan_name left join public.usage_monthly u on u.user_id=p.id and u.period_start=date_trunc('month',now())::date;
create function public.publish_awarded_certificate(p_user uuid,p_certificate uuid,p_token text,p_enabled boolean)
returns text language plpgsql security invoker set search_path='' as $$
declare c public.certificates; learner text; token text;
begin
 select * into c from public.certificates where id=p_certificate and user_id=p_user for update;
 if not found then raise exception 'CERTIFICATE_NOT_AWARDED'; end if;
 if not exists(select 1 from public.profiles where id=p_user and status='active') then raise exception 'ACCOUNT_INACTIVE'; end if;
 if not p_enabled then
  update public.certificate_publications set status='revoked',updated_at=now() where certificate_id=c.id and user_id=p_user;
  return null;
 end if;
 if p_token !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_TOKEN'; end if;
 select coalesce(nullif(trim(full_name),''),'Estudiante CodeZero') into learner from public.profiles where id=p_user;
 insert into public.certificate_publications(certificate_id,user_id,public_id,display_name,title,issued_on,status)
 values(c.id,p_user,p_token,left(learner,160),left(c.title,160),c.issued_at::date,'verified')
 on conflict(certificate_id) do update set
 public_id=case when public.certificate_publications.status='revoked' then excluded.public_id else public.certificate_publications.public_id end,
 display_name=excluded.display_name,title=excluded.title,status='verified',consented_at=now(),updated_at=now()
 returning public_id into token;
 return token;
end $$;
revoke all on function public.publish_awarded_certificate(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.publish_awarded_certificate(uuid,uuid,text,boolean) to service_role;
-- Catalog-backed ownership, retaining the existing Tutor key for backward compatibility.
alter table public.account_addons drop constraint account_addons_key_check;
alter table public.account_addons drop constraint account_addons_stripe_subscription_id_key;
alter table public.account_addons add column catalog_key text references public.addons(key);
alter table public.account_addons add column stripe_subscription_item_id text unique;
create index account_addons_catalog_idx on public.account_addons(catalog_key);
create index if not exists account_addons_subscription_idx on public.account_addons(stripe_subscription_id);
create table public.addon_billing_operations(
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 addon_key text not null references public.addons(key), action text not null check(action in ('add','cancel')),
 subscription_id text not null, schedule_id text,
 status text not null check(status in ('processing','confirmed','uncertain')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index addon_billing_operations_key_idx on public.addon_billing_operations(addon_key);
create index addon_billing_operations_user_idx on public.addon_billing_operations(user_id,created_at);
create unique index addon_billing_one_pending on public.addon_billing_operations(user_id,addon_key) where status in ('processing','uncertain');
alter table public.addon_billing_operations enable row level security;
revoke all on public.addon_billing_operations from anon,authenticated;
grant select on public.addon_billing_operations to authenticated;
grant all on public.addon_billing_operations to service_role;
create policy billing_operations_owner on public.addon_billing_operations for select to authenticated using(user_id=(select auth.uid()));
create function public.claim_addon_billing_operation(p_id uuid,p_user uuid,p_subscription text,p_action text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('addon-billing:'||p_user::text,0));
 if not exists(select 1 from public.profiles where id=p_user and status='active' and plan_name='starter' and stripe_subscription_id=p_subscription) then raise exception 'BASE_PLAN_REQUIRED'; end if;
 if p_action='add' and not exists(select 1 from public.addons where key='ai_tutor' and status='active') then raise exception 'ADDON_UNAVAILABLE'; end if;
 if exists(select 1 from public.addon_billing_operations where user_id=p_user and addon_key='ai_tutor' and status in ('processing','uncertain')) then return false; end if;
 insert into public.addon_billing_operations(id,user_id,addon_key,action,subscription_id,status) values(p_id,p_user,'ai_tutor',p_action,p_subscription,'processing');
 return true;
end $$;
revoke all on function public.claim_addon_billing_operation(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_addon_billing_operation(uuid,uuid,text,text) to service_role;

alter table public.account_addons add constraint account_addons_addon_key_fkey foreign key(addon_key) references public.addons(key);
create index account_addons_addon_key_idx on public.account_addons(addon_key);

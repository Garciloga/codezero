-- TEST ONLY. Catalogue + interest; does not replace entitlements or enable any billing.
create table public.addons (
 key text primary key check(key ~ '^[a-z][a-z0-9_]{1,63}$'),
 label text not null check(length(label) between 1 and 120),
 billing_type text not null check(billing_type in ('monthly','one_time')),
 entitlement_key text not null,
 monthly_limit integer check(monthly_limit > 0),
 status text not null default 'coming_soon' check(status in ('active','coming_soon'))
);
create table public.addon_waitlist (
 user_id uuid not null references auth.users(id) on delete cascade,
 addon_key text not null references public.addons(key),
 created_at timestamptz not null default now(),
 primary key(user_id,addon_key)
);
create index addon_waitlist_interest on public.addon_waitlist(addon_key);
alter table public.addons enable row level security;
alter table public.addon_waitlist enable row level security;
revoke all on public.addons,public.addon_waitlist from public,anon,authenticated;
grant select on public.addons to authenticated;
grant select,insert,delete on public.addon_waitlist to authenticated;
create policy addon_catalog_active_account on public.addons for select to authenticated
using(exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy waitlist_own_read on public.addon_waitlist for select to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
create policy waitlist_own_insert on public.addon_waitlist for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active')
 and exists(select 1 from public.addons where key=addon_key and status='coming_soon'));
create policy waitlist_own_delete on public.addon_waitlist for delete to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and status='active'));
insert into public.addons(key,label,billing_type,entitlement_key,monthly_limit,status) values
('ai_tutor','Tutor IA','monthly','ai_tutor',100,'coming_soon'),
('route_customer_success','Ruta de Customer Success','monthly','route_customer_success',null,'coming_soon'),
('route_operations','Operaciones · RevOps, Sales Ops y CS Ops','monthly','route_operations',null,'coming_soon'),
('route_qa','QA / Tester','monthly','route_qa',null,'coming_soon'),
('route_data_bi','Analista de datos / BI','monthly','route_data_bi',null,'coming_soon'),
('route_product','Producto · Product Owner / Product Manager','monthly','route_product',null,'coming_soon'),
('route_management','Management','monthly','route_management',null,'coming_soon'),
('route_solutions_integrations','Solutions Engineer / Integraciones','monthly','route_solutions_integrations',null,'coming_soon'),
('route_enablement','Capacitación y Enablement','monthly','route_enablement',null,'coming_soon'),
('route_growth','Marketing digital / Growth','monthly','route_growth',null,'coming_soon'),
('routes_three','Tres rutas profesionales','monthly','routes_three',null,'coming_soon'),
('routes_all','Todas las rutas','monthly','routes_all',null,'coming_soon'),
('ai_simulator','Simulador de situaciones','monthly','ai_simulator',20,'coming_soon'),
('tool_labs','Laboratorios de herramientas','monthly','tool_labs',null,'coming_soon'),
('extra_quota','Cuota extra','one_time','extra_quota',null,'coming_soon'),
('verified_certificate','Certificado verificable','one_time','verified_certificate',null,'coming_soon'),
('deep_diagnostic','Diagnóstico profundo','one_time','deep_diagnostic',null,'coming_soon'),
('employment_kit','Kit de empleabilidad','one_time','employment_kit',null,'coming_soon'),
('mentoring','Mentoría 1:1','one_time','mentoring',null,'coming_soon');

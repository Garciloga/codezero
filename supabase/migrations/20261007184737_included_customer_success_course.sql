create table public.cs_course_units (
 user_id uuid not null references public.profiles(id) on delete cascade,
 unit_index integer not null check(unit_index between 0 and 7),
 choice integer not null check(choice between 0 and 1),
 draft text not null check(length(draft) between 80 and 4000),
 version text not null default 'cs-faro-v1' check(version='cs-faro-v1'),
 updated_at timestamptz not null default now(),primary key(user_id,unit_index)
);
create table public.cs_course_attempts (
 id uuid primary key,user_id uuid not null references public.profiles(id) on delete cascade,
 score integer not null check(score in(0,13,25,38,50,63,75,88,100)),
 passed boolean generated always as (score>=75) stored,
 version text not null default 'cs-faro-v1' check(version='cs-faro-v1'),created_at timestamptz not null default now()
);
create index cs_attempts_user on public.cs_course_attempts(user_id,created_at desc);
create table public.cs_course_projects (
 id uuid primary key,user_id uuid not null references public.profiles(id) on delete cascade,
 draft text not null check(length(draft) between 300 and 16000),
 status text not null default 'submitted' check(status in('submitted','needs_revision','approved')),
 score integer check(score between 0 and 100),feedback text check(length(feedback) between 80 and 4000),
 rubric jsonb,reviewed_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),reviewed_at timestamptz,
 check((status='submitted' and score is null) or (status='approved' and score is not null and score>=70) or (status='needs_revision' and score is not null and score<70))
);
create index cs_projects_user on public.cs_course_projects(user_id,created_at desc);
create index cs_projects_reviewer on public.cs_course_projects(reviewed_by);
create index cs_projects_pending on public.cs_course_projects(created_at) where status='submitted';
alter table public.cs_course_units enable row level security;
alter table public.cs_course_attempts enable row level security;
alter table public.cs_course_projects enable row level security;
revoke all on public.cs_course_units,public.cs_course_attempts,public.cs_course_projects from public,anon,authenticated;
grant select on public.cs_course_units,public.cs_course_attempts,public.cs_course_projects to authenticated;
grant all on public.cs_course_units,public.cs_course_attempts,public.cs_course_projects to service_role;
create policy cs_units_own on public.cs_course_units for select to authenticated using(user_id=(select auth.uid()));
create policy cs_attempts_own on public.cs_course_attempts for select to authenticated using(user_id=(select auth.uid()));
create policy cs_projects_own on public.cs_course_projects for select to authenticated using(user_id=(select auth.uid()));
create function public.check_cs_course_access(p_user uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
 perform 1 from public.profiles where id=p_user and status='active' and (plan_name in('pro','enterprise') or role in('owner','admin')) for update;
 if not found then raise exception 'COURSE_PLAN_REQUIRED';end if;
end $$;
create function public.maybe_issue_cs_course_certificate(p_user uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
 if (select count(*) from public.cs_course_units where user_id=p_user)=8 and exists(select 1 from public.cs_course_attempts where user_id=p_user and passed) and exists(select 1 from public.cs_course_projects where user_id=p_user and status='approved') then
 insert into public.certificates(user_id,certificate_type,title,metadata) values(p_user,'customer-success-v1','CodeZero · Customer Success: Cuenta Faro',jsonb_build_object('course_version','cs-faro-v1','units',8,'included_in_plan',true,'certificate_fee_cents',0)) on conflict(user_id,certificate_type) do nothing;
 end if;
end $$;
create function public.save_cs_course_unit(p_user uuid,p_unit integer,p_choice integer,p_draft text) returns text language plpgsql security invoker set search_path=public as $$
begin
 perform public.check_cs_course_access(p_user);
 insert into public.cs_course_units(user_id,unit_index,choice,draft) values(p_user,p_unit,p_choice,p_draft) on conflict(user_id,unit_index) do update set choice=excluded.choice,draft=excluded.draft,updated_at=now();
 return 'saved';
end $$;
create function public.submit_cs_course_exam(p_user uuid,p_id uuid,p_score integer) returns text language plpgsql security invoker set search_path=public as $$
declare previous public.cs_course_attempts;q jsonb;
begin
 perform public.check_cs_course_access(p_user);
 select * into previous from public.cs_course_attempts where id=p_id;
 if found then if previous.user_id<>p_user then raise exception 'REQUEST_CONFLICT';end if;return case when previous.passed then 'passed' else 'failed' end;end if;
 if (select count(*) from public.cs_course_units where user_id=p_user)<>8 then raise exception 'UNITS_INCOMPLETE';end if;
 if p_score is null or p_score not in(0,13,25,38,50,63,75,88,100) then raise exception 'INVALID_SCORE';end if;
 q:=public.consume_quota(p_user,'exams',1);if not coalesce((q->>'allowed')::boolean,false) then return 'limit';end if;
 insert into public.cs_course_attempts(id,user_id,score) values(p_id,p_user,p_score);
 perform public.maybe_issue_cs_course_certificate(p_user);
 return case when p_score>=75 then 'passed' else 'failed' end;
end $$;
create function public.submit_cs_course_project(p_user uuid,p_id uuid,p_draft text) returns text language plpgsql security invoker set search_path=public as $$
declare previous public.cs_course_projects;q jsonb;
begin
 perform public.check_cs_course_access(p_user);select * into previous from public.cs_course_projects where id=p_id;
 if found then if previous.user_id<>p_user or previous.draft<>p_draft then raise exception 'REQUEST_CONFLICT';end if;return 'submitted';end if;
 if (select count(*) from public.cs_course_units where user_id=p_user)<>8 then raise exception 'UNITS_INCOMPLETE';end if;
 if exists(select 1 from public.cs_course_projects where user_id=p_user and status in('submitted','approved')) then raise exception 'PROJECT_ALREADY_SUBMITTED';end if;
 q:=public.consume_quota(p_user,'projects',1);if not coalesce((q->>'allowed')::boolean,false) then return 'limit';end if;
 insert into public.cs_course_projects(id,user_id,draft) values(p_id,p_user,p_draft);return 'submitted';
end $$;
create function public.review_cs_course_project(p_actor uuid,p_id uuid,p_score integer,p_feedback text,p_rubric jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare target uuid;total integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor and status='active' and role in('owner','admin')) then raise exception 'FORBIDDEN';end if;
 select user_id into target from public.cs_course_projects where id=p_id;if not found then raise exception 'PROJECT_NOT_FOUND';end if;
 perform 1 from public.profiles where id=target for update;
 if p_rubric is null or jsonb_typeof(p_rubric)<>'array' or jsonb_array_length(p_rubric)<>4 then raise exception 'INVALID_RUBRIC';end if;
 if exists(select 1 from jsonb_array_elements(p_rubric) x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-9]+$' or (x::text)::integer not between 0 and 25) then raise exception 'INVALID_RUBRIC';end if;
 select sum((x::text)::integer) into total from jsonb_array_elements(p_rubric) x;
 if p_score is null or p_feedback is null or total<>p_score or length(p_feedback) not between 80 and 4000 then raise exception 'INVALID_REVIEW';end if;
 update public.cs_course_projects set score=p_score,status=case when p_score>=70 then 'approved' else 'needs_revision' end,feedback=p_feedback,rubric=p_rubric,reviewed_by=p_actor,reviewed_at=now() where id=p_id and status='submitted';
 if not found then raise exception 'ALREADY_REVIEWED';end if;
 insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata) values(p_actor,'cs_project_reviewed','cs_course_project',p_id::text,jsonb_build_object('score',p_score,'rubric',p_rubric));
 perform public.maybe_issue_cs_course_certificate(target);
end $$;
revoke all on function public.check_cs_course_access(uuid),public.maybe_issue_cs_course_certificate(uuid),public.save_cs_course_unit(uuid,integer,integer,text),public.submit_cs_course_exam(uuid,uuid,integer),public.submit_cs_course_project(uuid,uuid,text),public.review_cs_course_project(uuid,uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.check_cs_course_access(uuid),public.maybe_issue_cs_course_certificate(uuid),public.save_cs_course_unit(uuid,integer,integer,text),public.submit_cs_course_exam(uuid,uuid,integer),public.submit_cs_course_project(uuid,uuid,text),public.review_cs_course_project(uuid,uuid,integer,text,jsonb) to service_role;
update public.addons set status='active',label='Customer Success · incluido en Pro y Enterprise' where key='route_customer_success';
update public.addons set label='Certificados incluidos al aprobar · sin venta separada',status='coming_soon' where key='verified_certificate';
update public.addons set label='Exámenes incluidos en la cuota del plan · sin venta separada',status='coming_soon' where key='extra_quota';

insert into public.support_faqs(slug,question,answer,category,keywords,status,sort_order) values
('examenes-incluidos','¿Los exámenes se cobran por separado?','No. Los intentos de examen disponibles se incluyen en la cuota mensual de tu plan. Al agotarla puedes esperar al siguiente periodo o cambiar de plan. No se venden intentos adicionales por separado.','Ejercicios y exámenes',array['examen','costo','cuota','incluido'],'published',90),
('certificados-incluidos','¿Cuánto cuesta emitir mi certificado?','No tiene cargo adicional. Debes completar el contenido disponible, aprobar el examen y cumplir los proyectos requeridos. El certificado acredita la formación de CodeZero, no un título oficial ni empleo garantizado.','Certificados',array['certificado','costo','incluido','aprobar'],'published',91),
('curso-customer-success','¿Qué incluye el curso Customer Success?','Está incluido en Pro y Enterprise: ocho unidades sobre Cuenta Faro, borradores privados, examen final y proyecto con revisión humana. El examen y la entrega de proyecto usan las cuotas del plan; el certificado se emite sin cargo adicional al cumplir los requisitos.','Aprendizaje y progreso',array['customer','success','curso','pro','enterprise'],'published',92),
('certificados-cancelacion','¿Pierdo mi certificado al cancelar?','Los certificados ya emitidos se conservan al bajar de plan. Puedes verlos en Mis certificados y decidir si publicas o retiras su enlace de verificación. Cancelar no equivale a revocar el documento.','Certificados',array['cancelar','free','certificado','conservar'],'published',93)
on conflict(slug) do update set question=excluded.question,answer=excluded.answer,category=excluded.category,keywords=excluded.keywords,status=excluded.status;

update public.addons set label='Kit de empleabilidad · incluido en Pro y Enterprise',status='coming_soon' where key='employment_kit';

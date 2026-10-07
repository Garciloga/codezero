-- Sandbox only: business conflict must not signal serialization retry to PostgREST.
create or replace function public.save_private_practice_progress(p_progress jsonb, p_revision integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare actor uuid := auth.uid(); current_revision integer; next_revision integer;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and status='active') then
  raise exception 'Active user required' using errcode='42501';
 end if;
 if p_revision is null or p_revision < 0 then raise exception 'Invalid revision' using errcode='22023'; end if;
 -- One advisory lock per user makes first inserts and competing saves atomic.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('private-practice:'||actor::text,0));
 select revision into current_revision from public.private_practice_progress where user_id=actor for update;
 if coalesce(current_revision,0) <> p_revision then raise exception 'Progress changed in another tab' using errcode='PT409'; end if;
 if current_revision is null then
  insert into public.private_practice_progress(user_id,progress) values(actor,p_progress) returning revision into next_revision;
 else
  update public.private_practice_progress set progress=p_progress,revision=current_revision+1,updated_at=now()
  where user_id=actor returning revision into next_revision;
 end if;
 return next_revision;
end $$;

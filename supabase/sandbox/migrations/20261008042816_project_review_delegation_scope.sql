-- Materialize the current delegation scope without exposing another viewer's private access rows.
-- Invoker triggers execute within the existing trusted organization-access rebuild transaction.
alter table public.learning_project_review_participants add column scope_authorized boolean not null default true;
create function codezero_private.refresh_project_review_delegation() returns trigger language plpgsql security invoker set search_path='' as $$
declare org uuid:=coalesce(new.organization_id,old.organization_id); viewer uuid:=coalesce(new.viewer_id,old.viewer_id); target uuid:=coalesce(new.target_id,old.target_id);
begin
 update public.learning_project_review_participants r set scope_authorized=(
 exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.learner_id)
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.user_id)
 and exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=r.organization_id and m.user_id=r.authorizer_id and m.active and m.role in ('owner','admin','manager','supervisor') and p.status='active')
 ) where r.organization_id=org and r.authorizer_id=viewer and target in(r.user_id,r.learner_id);
 return null;
end $$;
revoke all on function codezero_private.refresh_project_review_delegation() from public,anon,authenticated;
grant execute on function codezero_private.refresh_project_review_delegation() to service_role;
create trigger refresh_project_review_delegation after insert or delete or update on codezero_private.organization_access for each row execute function codezero_private.refresh_project_review_delegation();
drop policy project_participant_read on public.learning_project_review_participants;
create policy project_participant_read on public.learning_project_review_participants for select to authenticated using(
 scope_authorized and (user_id=(select auth.uid()) or learner_id=(select auth.uid()) or exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=learning_project_review_participants.learner_id))
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=learning_project_review_participants.organization_id and a.viewer_id=(select auth.uid()) and a.target_id=(select auth.uid()))
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.status='active')
);
create function codezero_private.refresh_project_authorizer() returns trigger language plpgsql security invoker set search_path='' as $$
declare person uuid; org uuid;
begin
 if tg_table_name='profiles' then person:=coalesce(new.id,old.id);else person:=coalesce(new.user_id,old.user_id);org:=coalesce(new.organization_id,old.organization_id);end if;
 update public.learning_project_review_participants r set scope_authorized=(
 exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.learner_id)
 and exists(select 1 from codezero_private.organization_access a where a.organization_id=r.organization_id and a.viewer_id=r.authorizer_id and a.target_id=r.user_id)
 and exists(select 1 from public.organization_memberships m join public.profiles p on p.id=m.user_id where m.organization_id=r.organization_id and m.user_id=r.authorizer_id and m.active and m.role in ('owner','admin','manager','supervisor') and p.status='active')
 ) where r.authorizer_id=person and (org is null or r.organization_id=org);
 return null;
end $$;
revoke all on function codezero_private.refresh_project_authorizer() from public,anon,authenticated;
grant execute on function codezero_private.refresh_project_authorizer() to service_role;
create trigger refresh_project_authorizer_status after update of status on public.profiles for each row execute function codezero_private.refresh_project_authorizer();
create trigger refresh_project_authorizer_membership after update of active,role on public.organization_memberships for each row execute function codezero_private.refresh_project_authorizer();

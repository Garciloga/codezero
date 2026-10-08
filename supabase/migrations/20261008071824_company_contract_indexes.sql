begin;
create index organization_contracts_recorder_idx on public.organization_contracts(recorded_by);
create index organization_invitation_team_idx on public.organization_invitations(organization_id,team_id);
-- Preserve scope while evaluating one invitation read policy.
drop policy invitation_creator_read on public.organization_invitations;
drop policy invitation_read on public.organization_invitations;
create policy invitation_read on public.organization_invitations for select to authenticated using(exists(select 1 from codezero_private.organization_access a where a.organization_id=organization_invitations.organization_id and a.viewer_id=(select auth.uid()) and (a.can_manage or created_by=(select auth.uid()))));
commit;

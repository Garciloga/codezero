-- Approved isolated sandbox only. Cover new foreign keys; no policy or quota changes.
begin;
create index organization_access_target_idx on codezero_private.organization_access(organization_id,target_id);
create index learning_errors_assignment_idx on public.learning_errors(organization_id,user_id,activity_key);
create index organization_audit_actor_idx on public.organization_audit_log(actor_id);
create index organization_audit_target_idx on public.organization_audit_log(target_id);
create index organization_invitation_accepted_idx on public.organization_invitations(accepted_user_id);
create index organization_invitation_creator_idx on public.organization_invitations(created_by);
create index organization_invitation_reports_idx on public.organization_invitations(organization_id,reports_to);
create index organization_membership_user_idx on public.organization_memberships(user_id);
commit;

alter table public.organization_invitations add column email_claimed_at timestamptz,
 add column email_attempts integer not null default 0 check(email_attempts between 0 and 5);
create or replace function public.claim_company_invitation_email(p_invite uuid,p_actor uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare i public.organization_invitations;
begin
 select * into i from public.organization_invitations where id=p_invite for update;
 if i.id is null or not public.company_can_invite(i.organization_id,p_actor,i.team_id) or i.accepted_at is not null or i.revoked_at is not null or i.expires_at<=now() then raise exception 'FORBIDDEN';end if;
 if i.created_by<>p_actor and not exists(select 1 from public.organization_memberships where organization_id=i.organization_id and user_id=p_actor and active and role in ('owner','admin')) and not exists(select 1 from public.profiles where id=p_actor and status='active' and role in ('owner','admin')) then raise exception 'FORBIDDEN';end if;
 if i.email_status='queued' or i.email_attempts>=5 or coalesce(i.email_claimed_at,i.email_started_at)>now()-interval '60 seconds' then return false;end if;
 if i.email_started_at is not null and i.email_started_at<now()-interval '23 hours' then return false;end if;
 update public.organization_invitations set email_status='sending',email_started_at=coalesce(email_started_at,now()),email_claimed_at=now(),email_attempts=email_attempts+1 where id=p_invite;return true;
end $$;
revoke all on function public.claim_company_invitation_email(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_company_invitation_email(uuid,uuid) to service_role;

-- Called only by authenticated backend routes using service_role.
-- Ticket, conversation, state and audit changes commit together.
create or replace function public.mutate_support_ticket(p_actor uuid, p_action text, p_ticket bigint default null, p_payload jsonb default '{}'::jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare t public.support_tickets%rowtype; actor_role text; body text; new_status text; new_priority text; result bigint;
begin
  select role into actor_role from public.profiles where id=p_actor and status='active';
  if actor_role is null then raise exception 'FORBIDDEN'; end if;
  if p_action='create' then
    if length(trim(p_payload->>'subject')) not between 3 and 180 or length(trim(p_payload->>'description')) not between 10 and 8000
       or p_payload->>'subject' is null or p_payload->>'description' is null then raise exception 'INVALID_TICKET'; end if;
    insert into public.support_tickets(user_id,subject,description,category,original_query)
    values(p_actor,trim(p_payload->>'subject'),trim(p_payload->>'description'),coalesce(p_payload->>'category','otro'),nullif(left(p_payload->>'original_query',500),'')) returning id into result;
    insert into public.support_ticket_messages(ticket_id,sender_user_id,sender_role,body)
    values(result,p_actor,'user',trim(p_payload->>'description'));
    return result;
  end if;
  select * into t from public.support_tickets where id=p_ticket for update;
  if t.id is null then raise exception 'TICKET_NOT_FOUND'; end if;
  body:=trim(coalesce(p_payload->>'body',''));
  if p_action='reply' then
    if t.user_id<>p_actor then raise exception 'TICKET_NOT_FOUND'; end if;
    if t.status='closed' then raise exception 'TICKET_CLOSED'; end if;
    if length(body) not between 1 and 8000 then raise exception 'INVALID_REPLY'; end if;
    insert into public.support_ticket_messages(ticket_id,sender_user_id,sender_role,body) values(t.id,p_actor,'user',body);
    update public.support_tickets set status=case when status in ('waiting_user','resolved') then 'open' else status end,
      resolved_at=case when status in ('waiting_user','resolved') then null else resolved_at end,updated_at=now() where id=t.id;
  elsif p_action='update' then
    if actor_role not in ('owner','admin') then raise exception 'FORBIDDEN'; end if;
    new_status:=p_payload->>'status';new_priority:=p_payload->>'priority';
    if new_status is null or new_status not in ('open','in_progress','waiting_user','resolved','closed')
       or new_priority is null or new_priority not in ('low','normal','high','urgent') or length(body)>8000 then raise exception 'INVALID_UPDATE'; end if;
    update public.support_tickets set status=new_status,priority=new_priority,assigned_to=p_actor,updated_at=now(),
      resolved_at=case when new_status='resolved' then coalesce(t.resolved_at,now()) when new_status='closed' then t.resolved_at else null end,
      closed_at=case when new_status='closed' then coalesce(t.closed_at,now()) else null end where id=t.id;
    if body<>'' then insert into public.support_ticket_messages(ticket_id,sender_user_id,sender_role,body) values(t.id,p_actor,'admin',body); end if;
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata)
    values(p_actor,'support_ticket_updated','support_ticket',t.id::text,jsonb_build_object('before',jsonb_build_object('status',t.status,'priority',t.priority),'after',jsonb_build_object('status',new_status,'priority',new_priority,'replied',body<>'')));
  else raise exception 'INVALID_ACTION'; end if;
  return t.id;
end;
$$;
revoke all on function public.mutate_support_ticket(uuid,text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.mutate_support_ticket(uuid,text,bigint,jsonb) to service_role;

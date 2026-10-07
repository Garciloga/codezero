-- Support S1 performance follow-up and RLS cleanup.

create index if not exists support_ticket_messages_sender_idx
  on public.support_ticket_messages(sender_user_id);

create index if not exists support_tickets_assigned_to_idx
  on public.support_tickets(assigned_to);

drop policy if exists "No client writes to addons" on public.account_addons;

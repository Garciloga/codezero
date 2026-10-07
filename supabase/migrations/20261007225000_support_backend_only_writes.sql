-- Apply after the atomic backend is deployed; old routes need direct writes until then.
-- Prevent bypassing backend validation, rate limits and atomic updates.
revoke insert,update,delete on public.support_tickets,public.support_ticket_messages from anon,authenticated;

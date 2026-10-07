import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../../../lib/security";
import { consumeRateLimit } from "../../../../../../lib/rate-limit";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Context) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return NextResponse.json({ error: "INVALID_TICKET" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`support-reply:${user.id}`, 20, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const form = await req.formData();
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 8000) {
    return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?reply=invalid`, req.url), 303);
  }

  const admin = createAdminSupabase();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id,user_id,status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ticket) return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });
  if (ticket.status === "closed") {
    return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?reply=closed`, req.url), 303);
  }

  const { error } = await admin.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_user_id: user.id,
    sender_role: "user",
    body,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?reply=error`, req.url), 303);
  }

  if (ticket.status === "waiting_user" || ticket.status === "resolved") {
    await admin.from("support_tickets").update({
      status: "open",
      resolved_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", ticketId);
  }

  return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?reply=1`, req.url), 303);
}

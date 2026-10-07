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

  const { error } = await createAdminSupabase().rpc("mutate_support_ticket", {
    p_actor: user.id, p_action: "reply", p_ticket: ticketId, p_payload: { body },
  });
  if (error?.message.includes("TICKET_NOT_FOUND")) return NextResponse.json({ error: "TICKET_NOT_FOUND" }, { status: 404 });
  if (error?.message.includes("FORBIDDEN")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const result = error?.message.includes("TICKET_CLOSED") ? "closed" : error ? "error" : "1";
  return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?reply=${result}`, req.url), 303);
}

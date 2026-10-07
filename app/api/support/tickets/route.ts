import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

const categories = new Set([
  "cuenta","aprendizaje","facturacion","tutor_ia","certificado","privacidad","tecnico","otro",
]);

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`support-ticket:${user.id}`, 5, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const form = await req.formData();
  const subject = String(form.get("subject") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const originalQuery = String(form.get("original_query") ?? "").trim().slice(0, 500);
  const categoryRaw = String(form.get("category") ?? "otro");
  const category = categories.has(categoryRaw) ? categoryRaw : "otro";

  if (subject.length < 3 || subject.length > 180 || description.length < 10 || description.length > 8000) {
    return NextResponse.redirect(new URL("/help/tickets?created=invalid", req.url), 303);
  }

  const admin = createAdminSupabase();
  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject,
      description,
      category,
      priority: "normal",
      original_query: originalQuery || null,
    })
    .select("id")
    .single();

  if (error || !ticket) {
    return NextResponse.redirect(new URL("/help/tickets?created=error", req.url), 303);
  }

  await admin.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_user_id: user.id,
    sender_role: "user",
    body: description,
  });

  return NextResponse.redirect(new URL(`/help/tickets/${ticket.id}?created=1`, req.url), 303);
}

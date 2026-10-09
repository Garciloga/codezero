import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
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

  const form = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!form) return new Response(null, { status: 413 });
  const subject = String(form.get("subject") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const originalQuery = String(form.get("original_query") ?? "").trim().slice(0, 500);
  const categoryRaw = String(form.get("category") ?? "otro");
  const category = categories.has(categoryRaw) ? categoryRaw : "otro";

  if (subject.length < 3 || subject.length > 180 || description.length < 10 || description.length > 8000) {
    return NextResponse.redirect(new URL("/help/tickets?created=invalid", req.url), 303);
  }

  const admin = createAdminSupabase();
  const { data: ticketId, error } = await admin.rpc("mutate_support_ticket", {
    p_actor: user.id, p_action: "create", p_payload: { subject, description, category, original_query: originalQuery },
  });
  if (error || !ticketId) return NextResponse.redirect(new URL("/help/tickets?created=error", req.url), 303);
  return NextResponse.redirect(new URL(`/help/tickets/${ticketId}?created=1`, req.url), 303);
}

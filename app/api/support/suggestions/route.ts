import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
const categories = new Set(["producto","contenido","faq","experiencia","otro"]);

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`support-suggestion:${user.id}`, 10, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const form = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!form) return new Response(null, { status: 413 });
  const title = String(form.get("title") ?? "").trim();
  const detail = String(form.get("detail") ?? "").trim();
  const categoryRaw = String(form.get("category") ?? "otro");
  const category = categories.has(categoryRaw) ? categoryRaw : "otro";

  if (title.length < 3 || title.length > 160 || detail.length < 10 || detail.length > 5000) {
    return NextResponse.redirect(new URL("/help/suggestions?submitted=invalid", req.url), 303);
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("support_suggestions").insert({
    user_id: user.id,
    title,
    detail,
    category,
  });

  if (error) {
    return NextResponse.redirect(new URL("/help/suggestions?submitted=error", req.url), 303);
  }

  return NextResponse.redirect(new URL("/help/suggestions?submitted=1", req.url), 303);
}

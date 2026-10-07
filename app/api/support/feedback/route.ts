import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`support-feedback:${user.id}`, 30, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const form = await req.formData();
  const faqId = Number(form.get("faq_id"));
  const helpful = String(form.get("helpful")) === "true";
  const queryText = String(form.get("query_text") ?? "").trim().slice(0, 500);

  if (!Number.isInteger(faqId) || faqId <= 0) {
    return NextResponse.json({ error: "INVALID_FAQ" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: faq } = await admin
    .from("support_faqs")
    .select("id,status")
    .eq("id", faqId)
    .eq("status", "published")
    .maybeSingle();

  if (!faq) return NextResponse.json({ error: "FAQ_NOT_FOUND" }, { status: 404 });

  const { error } = await admin.from("support_faq_feedback").insert({
    faq_id: faqId,
    user_id: user.id,
    helpful,
    query_text: queryText || null,
  });

  if (error) return NextResponse.json({ error: "FEEDBACK_FAILED" }, { status: 500 });

  return NextResponse.redirect(new URL("/help?feedback=1", req.url), 303);
}

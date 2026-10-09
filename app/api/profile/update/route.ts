import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const rate = await consumeRateLimit(`profile:${user.id}`, 10, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const formData = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!formData) return new Response(null, { status: 413 });
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.redirect(new URL("/profile?updated=invalid", req.url), 303);
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.redirect(new URL("/profile?updated=error", req.url), 303);
  }

  return NextResponse.redirect(new URL("/profile?updated=1", req.url), 303);
}

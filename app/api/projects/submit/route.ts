import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { consumeQuota, releaseQuota } from "../../../../lib/entitlements";
import { canAccessLevel, getProjectLevel } from "../../../../lib/access";
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

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`project:${user.id}`, 5, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const formData = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!formData) return new Response(null, { status: 413 });
  const projectId = Number(formData.get("project_id"));
  const submissionText = String(formData.get("submission_text") ?? "").trim();

  if (!Number.isInteger(projectId) || submissionText.length < 50 || submissionText.length > 20000) {
    return NextResponse.json({ error: "INVALID_SUBMISSION" }, { status: 400 });
  }

  const resolved = await getProjectLevel(projectId);
  if (!resolved) {
    return NextResponse.json({ error: "PROJECT_NOT_FOUND" }, { status: 404 });
  }

  const { levelNumber } = resolved;
  if (!(await canAccessLevel(user.id, levelNumber))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { data: latest } = await supabase
    .from("project_submissions")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && !["needs_revision"].includes(latest.status)) {
    return NextResponse.json({ error: "PROJECT_ALREADY_SUBMITTED" }, { status: 409 });
  }

  const quota = await consumeQuota(user.id, "projects", 1);
  if (!quota.allowed) {
    return NextResponse.redirect(
      new URL(`/learn/${levelNumber}/project?submitted=limit`, req.url),
      303
    );
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("project_submissions").insert({
    user_id: user.id,
    project_id: projectId,
    submission_text: submissionText,
    status: "submitted",
  });

  if (error) {
    await releaseQuota(user.id, "projects", 1);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(`/learn/${levelNumber}/project?submitted=1`, req.url),
    303
  );
}

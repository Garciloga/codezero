import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../../lib/security";
import { consumeRateLimit } from "../../../../../lib/rate-limit";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`admin-review:${user.id}`, 30, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  try {
    await requireAdmin(user.id);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const formData = await req.formData();
  const submissionId = Number(formData.get("submission_id"));
  const score = Number(formData.get("score"));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!Number.isInteger(submissionId) || !Number.isFinite(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: "INVALID_REVIEW" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: before, error: beforeError } = await admin
    .from("project_submissions")
    .select("status,score,feedback")
    .eq("id", submissionId)
    .single();

  if (beforeError || !before) {
    return NextResponse.json({ error: "SUBMISSION_NOT_FOUND" }, { status: 404 });
  }

  if (!["submitted", "needs_revision"].includes(before.status)) {
    return NextResponse.json({ error: "SUBMISSION_ALREADY_FINAL" }, { status: 409 });
  }

  const newStatus = score >= 70 ? "approved" : "needs_revision";

  const { error } = await admin
    .from("project_submissions")
    .update({
      score,
      feedback,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "project_reviewed",
    target_type: "project_submission",
    target_id: String(submissionId),
    metadata: {
      before: before ?? null,
      after: { status: newStatus, score, feedback },
    },
  });

  return NextResponse.redirect(new URL("/admin?reviewed=1", req.url), 303);
}

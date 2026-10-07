import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

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

  const { data: before } = await admin
    .from("project_submissions")
    .select("status,score,feedback")
    .eq("id", submissionId)
    .single();

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

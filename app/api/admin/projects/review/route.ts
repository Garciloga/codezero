import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../lib/admin";

export async function POST(req: Request) {
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
  const { error } = await admin
    .from("project_submissions")
    .update({
      score,
      feedback,
      status: score >= 70 ? "approved" : "needs_revision",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin?reviewed=1", req.url), 303);
}

import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { consumeQuota } from "../../../../lib/entitlements";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const formData = await req.formData();
  const projectId = Number(formData.get("project_id"));
  const levelNumber = Number(formData.get("level_number"));
  const submissionText = String(formData.get("submission_text") ?? "").trim();

  if (!Number.isInteger(projectId) || !Number.isInteger(levelNumber) || submissionText.length < 50) {
    return NextResponse.json({ error: "INVALID_SUBMISSION" }, { status: 400 });
  }

  const quota = await consumeQuota(user.id, "projects", 1);
  if (!quota.allowed) {
    return NextResponse.redirect(new URL(`/learn/${levelNumber}/project?submitted=limit`, req.url), 303);
  }

  const { error } = await supabase.from("project_submissions").insert({
    user_id: user.id,
    project_id: projectId,
    submission_text: submissionText,
    status: "submitted",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL(`/learn/${levelNumber}/project?submitted=1`, req.url), 303);
}

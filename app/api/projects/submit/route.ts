import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { consumeQuota } from "../../../../lib/entitlements";
import { canAccessLevel, getProjectLevel } from "../../../../lib/access";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const formData = await req.formData();
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

  const { error } = await supabase.from("project_submissions").insert({
    user_id: user.id,
    project_id: projectId,
    submission_text: submissionText,
    status: "submitted",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(
    new URL(`/learn/${levelNumber}/project?submitted=1`, req.url),
    303
  );
}

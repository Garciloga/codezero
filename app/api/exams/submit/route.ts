import { NextResponse } from "next/server";
import { maybeIssueWorkspaceDiploma } from "../../../../lib/workspace-diploma-server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { consumeQuota, releaseQuota } from "../../../../lib/entitlements";
import { canAccessLevel, getExamLevel } from "../../../../lib/access";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`exam:${user.id}`, 6, 600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const formData = await req.formData();
  const examId = Number(formData.get("exam_id"));

  if (!Number.isInteger(examId)) {
    return NextResponse.json({ error: "INVALID_EXAM" }, { status: 400 });
  }

  const resolved = await getExamLevel(examId);
  if (!resolved) {
    return NextResponse.json({ error: "EXAM_NOT_FOUND" }, { status: 404 });
  }

  const { exam, levelNumber } = resolved;
  if (!(await canAccessLevel(user.id, levelNumber))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const admin = createAdminSupabase();

  const { data: currentLevel } = await admin
    .from("levels")
    .select("id")
    .eq("level_number", levelNumber)
    .single();

  const { data: lessons } = await admin
    .from("lessons")
    .select("id")
    .eq("level_id", currentLevel?.id)
    .eq("status", "published");

  const lessonIds = (lessons ?? []).map((x: any) => Number(x.id));
  if (lessonIds.length === 0) {
    return NextResponse.json({ error: "NO_LESSONS" }, { status: 409 });
  }

  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .in("lesson_id", lessonIds);

  if ((completedRows?.length ?? 0) < lessonIds.length) {
    return NextResponse.json({ error: "LESSONS_INCOMPLETE" }, { status: 409 });
  }

  const { data: project } = await admin
    .from("level_projects")
    .select("id")
    .eq("level_id", currentLevel?.id)
    .eq("status", "published")
    .maybeSingle();

  if (project) {
    const { data: approved } = await supabase
      .from("project_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (!approved) {
      return NextResponse.json({ error: "PROJECT_NOT_APPROVED" }, { status: 409 });
    }
  }

  const { data: questions } = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = (questions ?? []).map((q: any) => Number(q.id));
  if (questionIds.length === 0) {
    return NextResponse.json({ error: "NO_QUESTIONS" }, { status: 409 });
  }

  const { data: solutions } = await admin
    .from("exam_solutions")
    .select("question_id, correct_answer")
    .in("question_id", questionIds);

  const solutionMap = new Map<number, string>(
    (solutions ?? []).map((s: any) => [Number(s.question_id), String(s.correct_answer)])
  );

  if (solutionMap.size !== questionIds.length) {
    return NextResponse.json({ error: "SOLUTIONS_INCOMPLETE" }, { status: 500 });
  }

  const quota = await consumeQuota(user.id, "exams", 1);
  if (!quota.allowed) {
    return NextResponse.redirect(
      new URL(`/learn/${levelNumber}/exam?result=limit`, req.url),
      303
    );
  }

  const answerMap: Record<string, string> = {};
  let correct = 0;

  for (const questionId of questionIds) {
    const answer = String(formData.get(`q_${questionId}`) ?? "");
    answerMap[String(questionId)] = answer;
    if (answer === solutionMap.get(questionId)) correct += 1;
  }

  const score = Math.round((correct / questionIds.length) * 100);
  const passed = score >= Number(exam.passing_score);

  const { error } = await admin.from("exam_attempts").insert({
    user_id: user.id,
    exam_id: examId,
    score,
    passed,
    answers: answerMap,
  });

  if (error) {
    await releaseQuota(user.id, "exams", 1);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (passed) await maybeIssueWorkspaceDiploma(user.id,levelNumber);
  if (passed && levelNumber === 15) {
    await admin.from("certificates").upsert(
      {
        user_id: user.id,
        certificate_type: "codezero-complete",
        title: "CodeZero · Programa completo",
        metadata: { completed_levels: 15, final_exam_score: score },
      },
      { onConflict: "user_id,certificate_type" }
    );
  }

  return NextResponse.redirect(
    new URL(
      `/learn/${levelNumber}/exam?result=${passed ? "passed" : "failed"}`,
      req.url
    ),
    303
  );
}

import { NextResponse } from "next/server";
import { maybeIssueWorkspaceDiploma } from "../../../../lib/workspace-diploma-server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { resolveSittingAnswers } from "../../../../lib/exam-sitting";
import { isUuid } from "../../../../lib/workspace-sandbox";
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
  const sittingId = formData.get("sitting_id");
  if (!isUuid(sittingId)) return NextResponse.json({error:"RELOAD_EXAM"},{status:400});
  const {data:sitting,error:sittingError}=await admin.from("exam_sittings").select("id,exam_id,variant,expires_at,attempt_id").eq("id",sittingId).eq("user_id",user.id).eq("exam_id",examId).maybeSingle();
  if(sittingError||!sitting)return NextResponse.json({error:"SITTING_UNAVAILABLE"},{status:409});
  if(sitting.attempt_id){const {data:previous}=await supabase.from("exam_attempts").select("passed").eq("id",sitting.attempt_id).eq("user_id",user.id).maybeSingle();return NextResponse.redirect(new URL(`/learn/${levelNumber}/exam?result=${previous?.passed?'passed':'failed'}`,req.url),303);}
  if(Date.parse(sitting.expires_at)<Date.now())return NextResponse.json({error:"RELOAD_EXAM"},{status:409});

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

  const displayed=Object.fromEntries(questionIds.map(id=>[String(id),String(formData.get(`q_${id}`)??'')]));
  let answerMap:Record<string,string>;
  try {answerMap=resolveSittingAnswers(sitting.variant.mapping,displayed);}catch{return NextResponse.json({error:"INVALID_ANSWERS"},{status:400});}
  if(Object.keys(answerMap).length!==questionIds.length||questionIds.some(id=>!answerMap[String(id)]))return NextResponse.json({error:"RELOAD_EXAM"},{status:409});
  let correct = 0;

  for (const questionId of questionIds) {
    const answer = answerMap[String(questionId)];
    if (answer === solutionMap.get(questionId)) correct += 1;
  }

  const score = Math.round((correct / questionIds.length) * 100);
  const passed = score >= Number(exam.passing_score);

  const {data:finished,error}=await admin.rpc("finish_exam_sitting",{p_user:user.id,p_sitting:sittingId,p_score:score,p_passed:passed,p_answers:answerMap});
  if(finished?.status==='limit')return NextResponse.redirect(new URL(`/learn/${levelNumber}/exam?result=limit`,req.url),303);
  if(error||!finished)return NextResponse.json({error:"EXAM_NOT_SAVED"},{status:500});
  if(finished.status==='replay'){const {data:previous}=await supabase.from('exam_attempts').select('passed').eq('id',finished.attempt_id).eq('user_id',user.id).maybeSingle();return NextResponse.redirect(new URL(`/learn/${levelNumber}/exam?result=${previous?.passed?'passed':'failed'}`,req.url),303);}

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

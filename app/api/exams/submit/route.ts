import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { consumeQuota } from "../../../../lib/entitlements";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const formData = await req.formData();
  const examId = Number(formData.get("exam_id"));
  const levelNumber = Number(formData.get("level_number"));

  if (!Number.isInteger(examId) || !Number.isInteger(levelNumber)) {
    return NextResponse.json({ error: "INVALID_EXAM" }, { status: 400 });
  }

  const quota = await consumeQuota(user.id, "exams", 1);
  if (!quota.allowed) {
    return NextResponse.redirect(new URL(`/learn/${levelNumber}/exam?result=limit`, req.url), 303);
  }

  const admin = createAdminSupabase();

  const { data: exam } = await admin
    .from("level_exams")
    .select("id, passing_score")
    .eq("id", examId)
    .single();

  if (!exam) return NextResponse.json({ error: "EXAM_NOT_FOUND" }, { status: 404 });

  const { data: questions } = await admin
    .from("exam_questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = (questions ?? []).map((q: any) => q.id);

  const { data: solutions } = await admin
    .from("exam_solutions")
    .select("question_id, correct_answer")
    .in("question_id", questionIds);

  const answerMap: Record<string, string> = {};
  let correct = 0;

  for (const questionId of questionIds) {
    const answer = String(formData.get(`q_${questionId}`) ?? "");
    answerMap[String(questionId)] = answer;
    const solution = (solutions ?? []).find((s: any) => Number(s.question_id) === Number(questionId));
    if (solution && answer === solution.correct_answer) correct += 1;
  }

  const score = questionIds.length === 0 ? 0 : Math.round((correct / questionIds.length) * 100);
  const passed = score >= exam.passing_score;

  const { error } = await supabase.from("exam_attempts").insert({
    user_id: user.id,
    exam_id: examId,
    score,
    passed,
    answers: answerMap,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(
    new URL(`/learn/${levelNumber}/exam?result=${passed ? "passed" : "failed"}&score=${score}`, req.url),
    303
  );
}

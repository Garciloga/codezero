import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { consumeQuota, releaseQuota } from "../../../../lib/entitlements";
import { canAccessLevel, getExerciseLevel } from "../../../../lib/access";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

import { lessonGate } from "../../../../lib/lesson-gate";
import { attemptCategory } from "../../../../lib/lesson-rules";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  const rate = await consumeRateLimit(`exercise:${user.id}`, 30, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const formData = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);

  if (!formData) return new Response(null, { status: 413 });
  const exerciseId = Number(formData.get("exercise_id"));
  const answer = String(formData.get("answer") ?? "");

  if (!Number.isInteger(exerciseId) || !["A", "B", "C", "D"].includes(answer)) {
    return NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });
  }

  const resolved = await getExerciseLevel(exerciseId);
  if (!resolved) {
    return NextResponse.json({ error: "EXERCISE_NOT_FOUND" }, { status: 404 });
  }

  const { lesson, levelNumber } = resolved;
  if (!(await canAccessLevel(user.id, levelNumber))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const admin = createAdminSupabase();
  const { data: solution, error: solutionError } = await admin
    .from("exercise_solutions")
    .select("correct_answer")
    .eq("exercise_id", exerciseId)
    .single();

  if (solutionError || !solution) {
    return NextResponse.json({ error: "SOLUTION_NOT_FOUND" }, { status: 500 });
  }

  const back = (result: string) => NextResponse.redirect(
    new URL(`/learn/${levelNumber}/${lesson.slug}?exercise=${result}#exercise-${exerciseId}`, req.url),
    303
  );

  // Same rule as navigation: an activity of a locked lesson cannot be answered by calling the API directly.
  const gate = await lessonGate(user.id, Number(lesson.id), Number(lesson.level_id));
  if (!gate.unlocked) return NextResponse.redirect(new URL(`/learn/${levelNumber}?locked=1`, req.url), 303);

  const isCorrect = answer === solution.correct_answer;
  const { data: previous } = await admin
    .from("exercise_attempts")
    .select("answer, is_correct, created_at")
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId);
  const history = (previous ?? []) as { answer: string; is_correct: boolean; created_at?: string }[];

  // A repeated request (double click, retry of the same form) is answered without a second record or charge.
  const repeated = history.some(row => row.answer === answer && row.created_at && Date.now() - Date.parse(row.created_at) < 3000);
  if (repeated) return back(isCorrect ? "correct" : "incorrect");

  // The minimum check of a lesson is free. Once the activity is passed, further attempts are
  // extra practice and use the plan's existing exercises quota, so limits cannot be bypassed.
  const category = attemptCategory(history.some(row => row.is_correct === true));
  if (category === "practice") {
    const quota = await consumeQuota(user.id, "exercises", 1);
    if (!quota.allowed) return back("limit");
  }

  const { error: attemptError } = await admin.from("exercise_attempts").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    answer,
    is_correct: isCorrect,
    category,
  });

  if (attemptError) {
    if (category === "practice") await releaseQuota(user.id, "exercises", 1);
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return back(isCorrect ? "correct" : "incorrect");
}

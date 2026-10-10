import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { canAccessLevel, getExerciseLevel } from "../../../../lib/access";
import { isTrustedBrowserRequest } from "../../../../lib/security";
import { consumeRateLimit } from "../../../../lib/rate-limit";

import { lessonGate } from "../../../../lib/lesson-gate";
import { attemptCategory } from "../../../../lib/lesson-rules";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
import { readAnswer } from "../../../../lib/lesson-rules";
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
  if (!Number.isInteger(exerciseId)) {
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
  const { data: exercise } = await admin.from("exercises").select("kind")
    .eq("id", exerciseId).eq("status", "published").maybeSingle();
  if (!exercise) return NextResponse.json({ error: "EXERCISE_NOT_FOUND" }, { status: 404 });
  const answer = readAnswer(exercise.kind, formData);
  if (!answer) return exercise.kind === "order_steps"
    ? NextResponse.redirect(new URL(`/learn/${levelNumber}/${lesson.slug}?exercise=invalid#exercise-${exerciseId}`, req.url), 303)
    : NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });

  const back = (result: string) => NextResponse.redirect(
    new URL(`/learn/${levelNumber}/${lesson.slug}?exercise=${result}#exercise-${exerciseId}`, req.url), 303);

  // Browser-provided correctness, category, counters and answers are never trusted.
  const gate = await lessonGate(user.id, Number(lesson.id), Number(lesson.level_id));
  if (!gate.unlocked) return NextResponse.redirect(new URL(`/learn/${levelNumber}?locked=1`, req.url), 303);
  // The RPC takes a per-user/activity transaction lock and performs quota+insert atomically.
  const { data, error } = await admin.rpc("submit_graded_lesson_attempt", {
    p_user: user.id, p_exercise: exerciseId, p_answer: answer,
  });
  if (error) return NextResponse.json({ error: "ATTEMPT_NOT_SAVED" }, { status: 500 });
  const result = data?.result;
  if (!["correct", "incorrect", "limit"].includes(result))
    return NextResponse.json({ error: "INVALID_RESULT" }, { status: 500 });
  return back(result);
}

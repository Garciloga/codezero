import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { consumeQuota } from "../../../../lib/entitlements";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const formData = await req.formData();
  const exerciseId = Number(formData.get("exercise_id"));
  const answer = String(formData.get("answer") ?? "");
  const levelNumber = Number(formData.get("level_number"));
  const lessonSlug = String(formData.get("lesson_slug") ?? "");

  if (
    !Number.isInteger(exerciseId) ||
    !Number.isInteger(levelNumber) ||
    !lessonSlug ||
    !["A", "B", "C", "D"].includes(answer)
  ) {
    return NextResponse.json({ error: "INVALID_ATTEMPT" }, { status: 400 });
  }

  const quota = await consumeQuota(user.id, "exercises", 1);

  if (!quota.allowed) {
    return NextResponse.redirect(
      new URL(
        `/learn/${levelNumber}/${lessonSlug}?exercise=limit`,
        req.url
      ),
      303
    );
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

  const isCorrect = answer === solution.correct_answer;

  const { error: attemptError } = await supabase
    .from("exercise_attempts")
    .insert({
      user_id: user.id,
      exercise_id: exerciseId,
      answer,
      is_correct: isCorrect,
    });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(
      `/learn/${levelNumber}/${lessonSlug}?exercise=${
        isCorrect ? "correct" : "incorrect"
      }`,
      req.url
    ),
    303
  );
}

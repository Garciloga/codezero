import { createServerSupabase } from "./supabase-server";

export async function getPassedLevelNumbers(userId: string) {
  const supabase = await createServerSupabase();

  const { data: exams } = await supabase
    .from("level_exams")
    .select("id, level_id");

  if (!exams || exams.length === 0) return new Set<number>();

  const { data: levels } = await supabase
    .from("levels")
    .select("id, level_number");

  const levelNumberById = new Map<number, number>();
  for (const level of levels ?? []) {
    levelNumberById.set(Number(level.id), Number(level.level_number));
  }

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("exam_id, passed")
    .eq("user_id", userId)
    .eq("passed", true);

  const examLevel = new Map<number, number>();
  for (const exam of exams) {
    const levelNumber = levelNumberById.get(Number(exam.level_id));
    if (levelNumber) examLevel.set(Number(exam.id), levelNumber);
  }

  const passed = new Set<number>();
  for (const attempt of attempts ?? []) {
    const levelNumber = examLevel.get(Number(attempt.exam_id));
    if (levelNumber) passed.add(levelNumber);
  }

  return passed;
}

export { isLevelUnlocked, isLevelIncludedInPlan } from "./learning-rules";

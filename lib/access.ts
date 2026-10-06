import { createAdminSupabase } from "./admin";
import { createServerSupabase } from "./supabase-server";
import { getPassedLevelNumbers, isLevelIncludedInPlan, isLevelUnlocked } from "./learning";

export async function canAccessLevel(userId: string, levelNumber: number) {
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, plan_name, status")
    .eq("id", userId)
    .single();

  if (!profile || profile.status !== "active") return false;

  const included = isLevelIncludedInPlan(
    levelNumber,
    profile.plan_name ?? "free",
    profile.role
  );

  if (!included) return false;

  const passedLevels = await getPassedLevelNumbers(userId);
  return isLevelUnlocked(levelNumber, passedLevels);
}

export async function getLessonLevel(lessonId: number) {
  const admin = createAdminSupabase();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, slug, level_id")
    .eq("id", lessonId)
    .single();

  if (!lesson) return null;

  const { data: level } = await admin
    .from("levels")
    .select("id, level_number")
    .eq("id", lesson.level_id)
    .single();

  if (!level) return null;
  return { lesson, levelNumber: Number(level.level_number) };
}

export async function getExerciseLevel(exerciseId: number) {
  const admin = createAdminSupabase();
  const { data: exercise } = await admin
    .from("exercises")
    .select("id, lesson_id")
    .eq("id", exerciseId)
    .single();

  if (!exercise) return null;
  return getLessonLevel(Number(exercise.lesson_id));
}

export async function getExamLevel(examId: number) {
  const admin = createAdminSupabase();
  const { data: exam } = await admin
    .from("level_exams")
    .select("id, level_id, passing_score")
    .eq("id", examId)
    .single();

  if (!exam) return null;

  const { data: level } = await admin
    .from("levels")
    .select("level_number")
    .eq("id", exam.level_id)
    .single();

  if (!level) return null;
  return { exam, levelNumber: Number(level.level_number) };
}

export async function getProjectLevel(projectId: number) {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("level_projects")
    .select("id, level_id")
    .eq("id", projectId)
    .single();

  if (!project) return null;

  const { data: level } = await admin
    .from("levels")
    .select("level_number")
    .eq("id", project.level_id)
    .single();

  if (!level) return null;
  return { project, levelNumber: Number(level.level_number) };
}

import {effectiveLearningPlan} from "./company-learning-server";
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
    await effectiveLearningPlan(userId,profile.plan_name ?? "free"),
    profile.role
  );

  if (!included) return false;

  const passedLevels = await getPassedLevelNumbers(userId);
  return isLevelUnlocked(levelNumber, passedLevels);
}

/** A published child of a draft level or course must stay inaccessible. */
async function getPublishedLevel(levelId: number) {
  const admin = createAdminSupabase();
  const { data: level } = await admin.from("levels")
    .select("id, level_number, course_id")
    .eq("id", levelId).eq("status", "published").maybeSingle();
  if (!level) return null;
  const { data: course } = await admin.from("courses")
    .select("id").eq("id", level.course_id).eq("status", "published").maybeSingle();
  return course ? level : null;
}

export async function getLessonLevel(lessonId: number) {
  const admin = createAdminSupabase();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, slug, level_id")
    .eq("id", lessonId)
    .eq("status", "published")
    .single();

  if (!lesson) return null;

  const level = await getPublishedLevel(Number(lesson.level_id));

  if (!level) return null;
  return { lesson, levelNumber: Number(level.level_number) };
}

export async function getExerciseLevel(exerciseId: number) {
  const admin = createAdminSupabase();
  const { data: exercise } = await admin
    .from("exercises")
    .select("id, lesson_id")
    .eq("id", exerciseId)
    .eq("status", "published")
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
    .eq("status", "published")
    .single();

  if (!exam) return null;

  const level = await getPublishedLevel(Number(exam.level_id));

  if (!level) return null;
  return { exam, levelNumber: Number(level.level_number) };
}

export async function getProjectLevel(projectId: number) {
  const admin = createAdminSupabase();
  const { data: project } = await admin
    .from("level_projects")
    .select("id, level_id")
    .eq("id", projectId)
    .eq("status", "published")
    .single();

  if (!project) return null;

  const level = await getPublishedLevel(Number(project.level_id));

  if (!level) return null;
  return { project, levelNumber: Number(level.level_number) };
}

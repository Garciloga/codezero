import { createAdminSupabase } from "./admin";
import { isLessonUnlocked } from "./lesson-rules";

/**
 * Server-side evidence for one lesson and one learner. Reads with the service
 * role so the result never depends on anything the browser declares.
 */
export async function lessonGate(userId: string, lessonId: number, levelId: number) {
  const admin = createAdminSupabase();
  const { data: lessonRows } = await admin.from("lessons").select("id, sort_order").eq("level_id", levelId).eq("status", "published").order("sort_order", { ascending: true });
  const ordered = (lessonRows ?? []).map((row: any) => Number(row.id));
  const { data: progressRows } = ordered.length
    ? await admin.from("lesson_progress").select("lesson_id, status").eq("user_id", userId).in("lesson_id", ordered)
    : { data: [] as any[] };
  const completed = new Set<number>((progressRows ?? []).filter((row: any) => row.status === "completed").map((row: any) => Number(row.lesson_id)));
  const { data: exerciseRows } = await admin.from("exercises").select("id").eq("lesson_id", lessonId).eq("status", "published");
  const exerciseIds = (exerciseRows ?? []).map((row: any) => Number(row.id));
  const { data: attemptRows } = exerciseIds.length
    ? await admin.from("exercise_attempts").select("exercise_id, is_correct").eq("user_id", userId).in("exercise_id", exerciseIds)
    : { data: [] as any[] };
  const attempted = new Set<number>(), passed = new Set<number>();
  for (const row of attemptRows ?? []) {
    attempted.add(Number(row.exercise_id));
    if (row.is_correct === true) passed.add(Number(row.exercise_id));
  }
  return {
    unlocked: isLessonUnlocked(ordered, completed, lessonId),
    completed: completed.has(lessonId),
    total: exerciseIds.length,
    attempted: attempted.size,
    passed: passed.size,
    passedIds: passed,
  };
}

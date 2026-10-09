/** Pure rules for verified lesson progress. No I/O; shared by pages, routes and tests. */
export type LessonState = "not_started" | "studying" | "practice_pending" | "practice_review" | "check_passed" | "completed";

export type LessonEvidence = {
  completed: boolean;
  /** Published activities of the lesson. */
  total: number;
  /** Activities with at least one attempt. */
  attempted: number;
  /** Activities with at least one correct attempt, graded by the server. */
  passed: number;
  /** True while the learner has the lesson open. */
  viewing?: boolean;
};

export function lessonState(e: LessonEvidence): LessonState {
  if (e.completed) return "completed";
  if (e.total > 0 && e.passed >= e.total) return "check_passed";
  if (e.total > 0 && e.attempted >= e.total) return "practice_review";
  if (e.attempted > 0) return "practice_pending";
  return e.viewing ? "studying" : "not_started";
}

/** Completion needs every published activity passed. A lesson without activities cannot be verified. */
export function canCompleteLesson(e: Pick<LessonEvidence, "total" | "passed">) {
  return e.total > 0 && e.passed >= e.total;
}

/** Verifiable percentage: passed activities weigh 90%; the last 10% is the confirmed completion. */
export function lessonPercent(e: LessonEvidence) {
  if (e.completed) return 100;
  if (e.total <= 0) return 0;
  return Math.round((Math.min(e.passed, e.total) / e.total) * 90);
}

/**
 * A lesson opens when every earlier lesson of the level is completed.
 * Completed lessons always stay open, so earlier progress is never locked out.
 */
export function isLessonUnlocked(orderedLessonIds: readonly number[], completed: ReadonlySet<number>, lessonId: number) {
  const index = orderedLessonIds.indexOf(lessonId);
  if (index < 0) return false;
  if (completed.has(lessonId)) return true;
  return orderedLessonIds.slice(0, index).every(id => completed.has(id));
}

/** The minimum check is free until the activity is passed; later attempts are metered extra practice. */
export function attemptCategory(alreadyPassed: boolean): "lesson_check" | "practice" {
  return alreadyPassed ? "practice" : "lesson_check";
}

export const LESSON_STATE_LABELS: Record<LessonState, string> = {
  not_started: "No iniciada",
  studying: "En estudio",
  practice_pending: "Práctica pendiente",
  practice_review: "Práctica en revisión",
  check_passed: "Comprobación aprobada",
  completed: "Lección completada",
};

import {effectiveLearningPlan} from "../../../lib/company-learning-server";
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";
import { getPassedLevelNumbers, isLevelUnlocked, isLevelIncludedInPlan } from "../../../lib/learning";

import { LESSON_STATE_LABELS, isLessonUnlocked, lessonPercent, lessonState } from "../../../lib/lesson-rules";

type PageProps = {
  params: Promise<{
    level: string;
  }>;
  searchParams: Promise<{
    locked?: string;
  }>;
};

type Lesson = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  estimated_minutes: number;
  sort_order: number;
};

export default async function LevelPage({ params, searchParams }: PageProps) {
  const { level } = await params;
  const { locked } = await searchParams;
  const levelNumber = Number(level);

  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 15) {
    notFound();
  }

  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const passedLevels = await getPassedLevelNumbers(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, plan_name")
    .eq("id", user.id)
    .single();

  if (
    !isLevelIncludedInPlan(
      levelNumber,
      await effectiveLearningPlan(user.id,profile?.plan_name ?? "free"),
      profile?.role
    )
  ) {
    redirect("/pricing");
  }

  if (!isLevelUnlocked(levelNumber, passedLevels)) {
    redirect("/dashboard");
  }

  const { data: currentLevel, error: levelError } = await supabase
    .from("levels")
    .select("id, level_number, slug, title, description, estimated_hours")
    .eq("level_number", levelNumber)
    .single();

  if (levelError || !currentLevel) notFound();

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, slug, title, description, content, estimated_minutes, sort_order")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const lessonList = (lessons ?? []) as Lesson[];
  const lessonIds = lessonList.map((lesson) => lesson.id);

  let completedLessonIds = new Set<number>();

  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds);

    completedLessonIds = new Set(
      (progressRows ?? [])
        .filter((row: any) => row.status === "completed")
        .map((row: any) => Number(row.lesson_id))
    );
  }

  // Evidence per lesson: published activities, attempted and passed (graded by the server).
  const totalByLesson = new Map<number, number>();
  const attemptedByLesson = new Map<number, Set<number>>();
  const passedByLesson = new Map<number, Set<number>>();

  if (lessonIds.length > 0) {
    const { data: exerciseRows } = await supabase
      .from("exercises")
      .select("id, lesson_id")
      .eq("status", "published")
      .in("lesson_id", lessonIds);

    const lessonByExercise = new Map<number, number>();
    for (const row of exerciseRows ?? []) {
      lessonByExercise.set(Number(row.id), Number(row.lesson_id));
      totalByLesson.set(Number(row.lesson_id), (totalByLesson.get(Number(row.lesson_id)) ?? 0) + 1);
    }

    if (lessonByExercise.size > 0) {
      const { data: attemptRows } = await supabase
        .from("exercise_attempts")
        .select("exercise_id, is_correct")
        .eq("user_id", user.id)
        .in("exercise_id", [...lessonByExercise.keys()]);

      for (const row of attemptRows ?? []) {
        const lessonId = lessonByExercise.get(Number(row.exercise_id));
        if (!lessonId) continue;
        if (!attemptedByLesson.has(lessonId)) attemptedByLesson.set(lessonId, new Set());
        attemptedByLesson.get(lessonId)!.add(Number(row.exercise_id));
        if (row.is_correct === true) {
          if (!passedByLesson.has(lessonId)) passedByLesson.set(lessonId, new Set());
          passedByLesson.get(lessonId)!.add(Number(row.exercise_id));
        }
      }
    }
  }

  const evidenceFor = (lessonId: number) => ({
    completed: completedLessonIds.has(lessonId),
    total: totalByLesson.get(lessonId) ?? 0,
    attempted: attemptedByLesson.get(lessonId)?.size ?? 0,
    passed: passedByLesson.get(lessonId)?.size ?? 0,
  });
  const activitiesTotal = lessonList.reduce((sum, lesson) => sum + evidenceFor(lesson.id).total, 0);
  const activitiesAttempted = lessonList.reduce((sum, lesson) => sum + evidenceFor(lesson.id).attempted, 0);
  const activitiesPassed = lessonList.reduce((sum, lesson) => sum + evidenceFor(lesson.id).passed, 0);
  const toReinforce = lessonList.filter((lesson) => {
    const item = evidenceFor(lesson.id);
    return item.attempted > item.passed;
  });

  const completedCount = lessonList.filter((lesson) =>
    completedLessonIds.has(lesson.id)
  ).length;

  const progressPercent =
    lessonList.length === 0
      ? 0
      : Math.round((completedCount / lessonList.length) * 100);

  const allLessonsCompleted =
    lessonList.length > 0 && completedCount === lessonList.length;

  const levelPassed = passedLevels.has(levelNumber);

  const { data: project } = await supabase
    .from("level_projects")
    .select("id, title, brief")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .maybeSingle();

  let projectSubmitted = false;
  let projectApproved = false;

  if (project) {
    const { data: submissions } = await supabase
      .from("project_submissions")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestSubmission = submissions?.[0];
    projectSubmitted = Boolean(latestSubmission);
    projectApproved = latestSubmission?.status === "approved";
  }

  const requirementsComplete =
    allLessonsCompleted && (!project || projectApproved);

  return (
    <LocalizedContent><main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">
            NIVEL {currentLevel.level_number} · {levelPassed ? "APROBADO" : "EN CURSO"}
          </span>
          <h1 style={{ marginBottom: 8 }}>{currentLevel.title}</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            {currentLevel.description}
          </p>
        </div>

        <Link className="btn secondary" href="/dashboard">
          Volver a mi ruta
        </Link>
      </div>

      <div className="grid grid4" style={{ marginTop: 28 }}>
        <div className="card">
          <div className="muted">Nivel</div>
          <div className="stat">{currentLevel.level_number} / 15</div>
        </div>
        <div className="card">
          <div className="muted">Duración estimada</div>
          <div className="stat">{currentLevel.estimated_hours}h*</div>
        </div>
        <div className="card">
          <div className="muted">Lecciones</div>
          <div className="stat">{lessonList.length}</div>
        </div>
        <div className="card">
          <div className="muted">Progreso</div>
          <div className="stat">{progressPercent}%</div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        *Incluye estudio, práctica, ejercicios, evaluación y trabajo independiente del nivel.
      </p>

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 16 }}>
          <div>
            <span className="pill">CONTENIDO DEL NIVEL</span>
            <h2 style={{ marginBottom: 4 }}>Lecciones</h2>
            <p className="muted">{completedCount} de {lessonList.length} completadas</p>
          </div>
          <strong>{progressPercent}%</strong>
        </div>

        <div className="bar" style={{ marginBottom: 22 }}>
          <i style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="muted" style={{ marginBottom: 16 }}>
          Actividades intentadas: {activitiesAttempted} de {activitiesTotal} · Actividades aprobadas: {activitiesPassed} de {activitiesTotal}
        </p>

        {locked === "1" && (
          <div className="card" role="alert" style={{ marginBottom: 16 }}>
            <b>Esa lección todavía está bloqueada.</b>
            <p className="muted" style={{ marginBottom: 0 }}>
              Completa las lecciones anteriores en orden. Las que ya completaste siguen abiertas para repasar.
            </p>
          </div>
        )}

        {toReinforce.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <b>Áreas por reforzar</b>
            <ul style={{ marginBottom: 0 }}>
              {toReinforce.map((lesson) => (
                <li key={lesson.id}>
                  <Link href={`/learn/${currentLevel.level_number}/${lesson.slug}#practica`} style={{ textDecoration: "underline" }}>{lesson.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lessonsError && (
          <div className="card" style={{ marginBottom: 16 }}>
            <b>No se pudieron cargar las lecciones.</b>
            <p className="muted">{lessonsError.message}</p>
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {lessonList.map((lesson, index) => {
            const completed = completedLessonIds.has(lesson.id);
            const evidence = evidenceFor(lesson.id);
            const state = lessonState(evidence);
            const unlocked = isLessonUnlocked(lessonIds, completedLessonIds, lesson.id);

            return (
              <div className="card" key={lesson.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 520px" }}>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      LECCIÓN {index + 1} · {lesson.estimated_minutes} min
                    </div>
                    <h3 style={{ marginTop: 0, marginBottom: 8 }}>{lesson.title}</h3>
                    {lesson.description && (
                      <p className="muted" style={{ marginBottom: 0 }}>{lesson.description}</p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="pill" data-lesson-state={unlocked ? state : "locked"}>{unlocked ? LESSON_STATE_LABELS[state] : "Bloqueada"}</span>
                    <span className="muted">{lessonPercent(evidence)}%</span>
                    {unlocked ? (
                      <Link
                        className="btn secondary"
                        href={`/learn/${currentLevel.level_number}/${lesson.slug}`}
                      >
                        {completed ? "Repasar" : "Abrir lección"}
                      </Link>
                    ) : (
                      <span className="muted">Completa la lección anterior</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {project && (
        <section style={{ marginTop: 32 }}>
          <div className="card">
            <span className="pill">PROYECTO CAPSTONE</span>
            <h2>{project.title}</h2>
            <p className="muted">{project.brief}</p>
            <Link className="btn secondary" href={`/learn/${currentLevel.level_number}/project`}>
              {projectSubmitted ? (projectApproved ? "Ver proyecto aprobado" : "Ver estado del proyecto") : "Abrir proyecto"}
            </Link>
          </div>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <div className="card">
          <span className="pill">EVALUACIÓN FINAL</span>
          <h2>Demuestra dominio del Nivel {currentLevel.level_number}</h2>

          {levelPassed ? (
            <>
              <p className="muted">
                Ya aprobaste este nivel. Puedes repetir la evaluación o continuar con el siguiente nivel.
              </p>
              <Link className="btn secondary" href={`/learn/${currentLevel.level_number}/exam`}>
                Repasar evaluación
              </Link>
            </>
          ) : requirementsComplete ? (
            <>
              <p className="muted">
                Cumpliste los requisitos del nivel. La evaluación final ya está disponible.
              </p>
              <Link className="btn" href={`/learn/${currentLevel.level_number}/exam`}>
                Presentar evaluación
              </Link>
            </>
          ) : (
            <p className="muted" style={{ marginBottom: 0 }}>
              Completa todas las lecciones{project ? " y obtén la aprobación del proyecto" : ""} para desbloquear la evaluación final.
            </p>
          )}
        </div>
      </section>
    </main></LocalizedContent>
  );
}


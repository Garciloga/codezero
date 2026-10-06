import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../../lib/supabase-server";

type PageProps = {
  params: Promise<{
    level: string;
    lesson: string;
  }>;
  searchParams: Promise<{
    completed?: string;
    exercise?: string;
  }>;
};

type Exercise = {
  id: number;
  prompt: string;
  options: string[];
  explanation: string | null;
};

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { level, lesson: lessonSlug } = await params;
  const { completed, exercise: exerciseResult } = await searchParams;
  const levelNumber = Number(level);

  if (!Number.isInteger(levelNumber) || levelNumber < 1) notFound();

  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentLevel } = await supabase
    .from("levels")
    .select("id, level_number, title")
    .eq("level_number", levelNumber)
    .single();

  if (!currentLevel) notFound();

  const { data: currentLesson } = await supabase
    .from("lessons")
    .select("id, slug, title, description, content, estimated_minutes, sort_order")
    .eq("level_id", currentLevel.id)
    .eq("slug", lessonSlug)
    .eq("status", "published")
    .single();

  if (!currentLesson) notFound();

  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, slug, title, sort_order")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const lessons = allLessons ?? [];
  const currentIndex = lessons.findIndex((item: any) => item.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("status, progress_percent, completed_at")
    .eq("user_id", user.id)
    .eq("lesson_id", currentLesson.id)
    .maybeSingle();

  const { data: exerciseRows } = await supabase
    .from("exercises")
    .select("id, prompt, options, explanation")
    .eq("lesson_id", currentLesson.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const exercises = (exerciseRows ?? []) as Exercise[];
  const exerciseIds = exercises.map((item) => item.id);

  let attempts: any[] = [];

  if (exerciseIds.length > 0) {
    const { data } = await supabase
      .from("exercise_attempts")
      .select("exercise_id, answer, is_correct, created_at")
      .eq("user_id", user.id)
      .in("exercise_id", exerciseIds)
      .order("created_at", { ascending: false });

    attempts = data ?? [];
  }

  const latestAttemptByExercise = new Map<number, any>();

  for (const attempt of attempts) {
    const exerciseId = Number(attempt.exercise_id);
    if (!latestAttemptByExercise.has(exerciseId)) {
      latestAttemptByExercise.set(exerciseId, attempt);
    }
  }

  const isCompleted = progress?.status === "completed";

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">
            NIVEL {currentLevel.level_number} · LECCIÓN {currentIndex + 1}
          </span>
          <h1 style={{ marginBottom: 8 }}>{currentLesson.title}</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            {currentLesson.description}
          </p>
        </div>

        <Link className="btn secondary" href={`/learn/${currentLevel.level_number}`}>
          Volver al nivel
        </Link>
      </div>

      {completed === "1" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Lección completada.</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            Tu progreso se guardó correctamente.
          </p>
        </div>
      )}

      {exerciseResult === "correct" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Respuesta correcta.</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            El intento se guardó en tu progreso.
          </p>
        </div>
      )}

      {exerciseResult === "incorrect" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Respuesta incorrecta.</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            Revisa la explicación y vuelve a intentarlo cuando quieras.
          </p>
        </div>
      )}

      {exerciseResult === "limit" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Alcanzaste el límite mensual de ejercicios de tu plan.</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            Puedes continuar estudiando el contenido y revisar tus intentos anteriores.
          </p>
        </div>
      )}

      <div className="grid grid2">
        <article className="card">
          <div className="muted" style={{ marginBottom: 8 }}>
            {currentLesson.estimated_minutes} minutos estimados
          </div>

          <h2>Contenido</h2>

          <p style={{ lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {currentLesson.content}
          </p>

          <div style={{ marginTop: 28 }}>
            {isCompleted ? (
              <span className="pill">COMPLETADA</span>
            ) : (
              <form action="/api/lessons/complete" method="post">
                <input type="hidden" name="lesson_id" value={currentLesson.id} />
                <input type="hidden" name="level_number" value={currentLevel.level_number} />
                <input type="hidden" name="lesson_slug" value={currentLesson.slug} />
                <button className="btn" type="submit">
                  Marcar como completada
                </button>
              </form>
            )}
          </div>
        </article>

        <aside className="card">
          <h3>Tu avance</h3>
          <p className="muted">
            Estado: {isCompleted ? "Completada" : "Pendiente"}
          </p>

          <div className="bar" style={{ marginBottom: 24 }}>
            <i style={{ width: isCompleted ? "100%" : "0%" }} />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {previousLesson && (
              <Link
                className="btn secondary"
                href={`/learn/${currentLevel.level_number}/${previousLesson.slug}`}
              >
                ← Lección anterior
              </Link>
            )}

            {nextLesson ? (
              <Link
                className="btn secondary"
                href={`/learn/${currentLevel.level_number}/${nextLesson.slug}`}
              >
                Siguiente lección →
              </Link>
            ) : (
              <Link className="btn secondary" href="/dashboard">
                Volver a Mi CodeZero
              </Link>
            )}
          </div>
        </aside>
      </div>

      {exercises.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <span className="pill">PRÁCTICA</span>
          <h2>Comprueba lo aprendido</h2>

          <div style={{ display: "grid", gap: 18 }}>
            {exercises.map((exercise) => {
              const latestAttempt = latestAttemptByExercise.get(exercise.id);
              const labels = ["A", "B", "C", "D"];

              return (
                <div className="card" key={exercise.id}>
                  <h3 style={{ marginTop: 0 }}>{exercise.prompt}</h3>

                  {latestAttempt && (
                    <p className="muted">
                      Último intento: {latestAttempt.is_correct ? "Correcto" : "Incorrecto"}
                    </p>
                  )}

                  <form action="/api/exercises/submit" method="post">
                    <input type="hidden" name="exercise_id" value={exercise.id} />
                    <input type="hidden" name="level_number" value={currentLevel.level_number} />
                    <input type="hidden" name="lesson_slug" value={currentLesson.slug} />

                    <div style={{ display: "grid", gap: 10, margin: "18px 0" }}>
                      {exercise.options.map((option, index) => (
                        <label
                          key={`${exercise.id}-${index}`}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                            padding: 12,
                            border: "1px solid #e5e9f0",
                            borderRadius: 12,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={labels[index]}
                            required
                          />
                          <span>
                            <b>{labels[index]}.</b> {option}
                          </span>
                        </label>
                      ))}
                    </div>

                    <button className="btn" type="submit">
                      Enviar respuesta
                    </button>
                  </form>

                  {latestAttempt && exercise.explanation && (
                    <div style={{ marginTop: 18 }}>
                      <b>Explicación</b>
                      <p className="muted" style={{ marginBottom: 0 }}>
                        {exercise.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

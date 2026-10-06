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
  }>;
};

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { level, lesson: lessonSlug } = await params;
  const { completed } = await searchParams;
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
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";

type PageProps = {
  params: Promise<{
    level: string;
  }>;
};

export default async function LevelPage({ params }: PageProps) {
  const { level } = await params;
  const levelNumber = Number(level);

  if (!Number.isInteger(levelNumber) || levelNumber < 1) {
    notFound();
  }

  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentLevel, error: levelError } = await supabase
    .from("levels")
    .select("id, level_number, slug, title, description, estimated_hours")
    .eq("level_number", levelNumber)
    .single();

  if (levelError || !currentLevel) {
    notFound();
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("level_id", currentLevel.id)
    .order("sort_order", { ascending: true });

  const lessonList = lessons ?? [];

  const lessonIds = lessonList.map((lesson: any) => lesson.id);

  let progressRows: any[] = [];

  if (lessonIds.length > 0) {
    const { data } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds);

    progressRows = data ?? [];
  }

  const completedLessonIds = new Set(
    progressRows
      .filter(
        (progress: any) =>
          progress.completed === true ||
          progress.status === "completed"
      )
      .map((progress: any) => progress.lesson_id)
  );

  const completedCount = lessonList.filter((lesson: any) =>
    completedLessonIds.has(lesson.id)
  ).length;

  const progressPercent =
    lessonList.length === 0
      ? 0
      : Math.round((completedCount / lessonList.length) * 100);

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">NIVEL {currentLevel.level_number}</span>
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
          <div className="stat">{currentLevel.estimated_hours}h</div>
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

      <section style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 20,
            marginBottom: 16,
          }}
        >
          <div>
            <span className="pill">CONTENIDO DEL NIVEL</span>
            <h2 style={{ marginBottom: 4 }}>Lecciones</h2>
            <p className="muted">
              {completedCount} de {lessonList.length} completadas
            </p>
          </div>

          <strong>{progressPercent}%</strong>
        </div>

        <div className="bar" style={{ marginBottom: 22 }}>
          <i style={{ width: `${progressPercent}%` }} />
        </div>

        {lessonList.length === 0 ? (
          <div className="card">
            <h3>Estamos preparando este nivel</h3>
            <p className="muted">
              El nivel ya existe en CodeZero, pero todavía no tiene lecciones
              publicadas.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {lessonList.map((lesson: any, index: number) => {
              const completed = completedLessonIds.has(lesson.id);

              return (
                <div className="card" key={lesson.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    <div>
                      <div className="muted" style={{ marginBottom: 6 }}>
                        LECCIÓN {index + 1}
                      </div>

                      <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                        {lesson.title}
                      </h3>

                      {lesson.description && (
                        <p className="muted" style={{ marginBottom: 0 }}>
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <span className="pill">
                      {completed ? "COMPLETADA" : "PENDIENTE"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
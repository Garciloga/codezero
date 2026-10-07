import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";
import { getPassedLevelNumbers, isLevelUnlocked, isLevelIncludedInPlan } from "../../../lib/learning";

type PageProps = {
  params: Promise<{
    level: string;
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

export default async function LevelPage({ params }: PageProps) {
  const { level } = await params;
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
      profile?.plan_name ?? "free",
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

        {lessonsError && (
          <div className="card" style={{ marginBottom: 16 }}>
            <b>No se pudieron cargar las lecciones.</b>
            <p className="muted">{lessonsError.message}</p>
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {lessonList.map((lesson, index) => {
            const completed = completedLessonIds.has(lesson.id);

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
                    <span className="pill">{completed ? "COMPLETADA" : "PENDIENTE"}</span>
                    <Link
                      className="btn secondary"
                      href={`/learn/${currentLevel.level_number}/${lesson.slug}`}
                    >
                      {completed ? "Repasar" : "Abrir lección"}
                    </Link>
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


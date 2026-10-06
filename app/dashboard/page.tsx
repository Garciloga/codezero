import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import { getEntitlements } from "../../lib/entitlements";
import { getPassedLevelNumbers, isLevelUnlocked } from "../../lib/learning";

type Level = {
  id: number;
  level_number: number;
  slug: string;
  title: string;
  description: string | null;
  estimated_hours: number | null;
};

export default async function Dashboard() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ent = await getEntitlements(user.id);
  const usage = (ent as any).usage ?? {};
  const passedLevels = await getPassedLevelNumbers(user.id);

  const { data: certificate } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", user.id)
    .eq("certificate_type", "codezero-complete")
    .maybeSingle();

  const { data: levels, error: levelsError } = await supabase
    .from("levels")
    .select("id, level_number, slug, title, description, estimated_hours")
    .order("level_number", { ascending: true });

  const learningLevels = (levels ?? []) as Level[];

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, level_id")
    .eq("status", "published");

  const lessonRows = lessons ?? [];
  const lessonIds = lessonRows.map((lesson: any) => lesson.id);

  let completedLessonIds = new Set<number>();

  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .in("lesson_id", lessonIds);

    completedLessonIds = new Set(
      (progressRows ?? []).map((row: any) => Number(row.lesson_id))
    );
  }

  const progressByLevel = new Map<number, { total: number; completed: number }>();

  for (const level of learningLevels) {
    progressByLevel.set(level.id, { total: 0, completed: 0 });
  }

  for (const lesson of lessonRows as any[]) {
    const entry = progressByLevel.get(Number(lesson.level_id));
    if (!entry) continue;
    entry.total += 1;
    if (completedLessonIds.has(Number(lesson.id))) entry.completed += 1;
  }

  const totalLessons = lessonRows.length;
  const totalCompleted = lessonRows.filter((lesson: any) =>
    completedLessonIds.has(Number(lesson.id))
  ).length;

  const overallProgress =
    totalLessons === 0 ? 0 : Math.round((totalCompleted / totalLessons) * 100);

  const totalHours = learningLevels.reduce(
    (sum, level) => sum + (level.estimated_hours ?? 0),
    0
  );

  const pct = (used: number, limit: number) =>
    limit < 0
      ? 0
      : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">{ent.plan_name}</span>
          <h1>Mi CodeZero</h1>
          <p className="muted">De cero a construir soluciones técnicas para SaaS.</p>
        </div>

        <form action="/api/auth/signout" method="post">
          <button className="btn secondary">Salir</button>
        </form>
      </div>

      <div className="grid grid4">
        <div className="card">
          <div className="muted">Plan</div>
          <div className="stat">{ent.plan_name}</div>
        </div>
        <div className="card">
          <div className="muted">Niveles</div>
          <div className="stat">{learningLevels.length}</div>
        </div>
        <div className="card">
          <div className="muted">Ruta completa</div>
          <div className="stat">{totalHours}h</div>
        </div>
        <div className="card">
          <div className="muted">Progreso</div>
          <div className="stat">{overallProgress}%</div>
        </div>
      </div>

      {levelsError && (
        <div className="card" style={{ marginTop: 18 }}>
          <b>No se pudieron cargar los niveles.</b>
          <p className="muted">{levelsError.message}</p>
        </div>
      )}

      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 16 }}>
          <div>
            <span className="pill">RUTA DE APRENDIZAJE</span>
            <h2 style={{ marginBottom: 6 }}>Tu camino en CodeZero</h2>
            <p className="muted" style={{ margin: 0 }}>
              Completa cada nivel y aprueba su evaluación para desbloquear el siguiente.
            </p>
          </div>
          <div className="muted">
            {learningLevels.length} niveles · {totalHours} horas
          </div>
        </div>

        <div className="grid grid2">
          {learningLevels.map((level) => {
            const progress = progressByLevel.get(level.id) ?? { total: 0, completed: 0 };
            const levelProgress =
              progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);
            const unlocked = isLevelUnlocked(level.level_number, passedLevels);
            const passed = passedLevels.has(level.level_number);

            return (
              <div className="card" key={level.id} style={{ opacity: unlocked ? 1 : 0.65 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
                  <div>
                    <span className="pill">
                      NIVEL {level.level_number} · {passed ? "APROBADO" : unlocked ? "DISPONIBLE" : "BLOQUEADO"}
                    </span>
                    <h3 style={{ marginBottom: 8 }}>{level.title}</h3>
                    <p className="muted">
                      {level.description ?? "Continúa desarrollando tus habilidades técnicas."}
                    </p>
                  </div>
                  <b>{level.estimated_hours ?? 0}h</b>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="muted">Progreso</span>
                    <span className="muted">{levelProgress}%</span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${levelProgress}%` }} />
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  {unlocked ? (
                    <Link className="btn secondary" href={`/learn/${level.level_number}`}>
                      {passed ? "Repasar nivel" : "Entrar al nivel"}
                    </Link>
                  ) : (
                    <span className="btn secondary" style={{ cursor: "not-allowed" }}>
                      Completa el nivel anterior
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {certificate && (
        <section style={{ marginTop: 32 }}>
          <div className="card">
            <span className="pill">PROGRAMA COMPLETADO</span>
            <h2>Tu certificación CodeZero está disponible</h2>
            <p className="muted">Completaste los 15 niveles y aprobaste la evaluación final.</p>
            <Link className="btn" href="/certificate">Ver certificado</Link>
          </div>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <h2>Uso mensual</h2>
        <div className="grid grid2">
          {[
            ["Ejercicios", usage.exercises ?? 0, ent.exercise_limit],
            ["Exámenes", usage.exams ?? 0, ent.exam_limit],
            ["IA Tutor", usage.ai_queries ?? 0, ent.ai_query_limit],
            ["Proyectos", usage.projects ?? 0, ent.project_limit],
          ].map(([name, used, limit]) => (
            <div className="card" key={name as string}>
              <p><b>{name}</b></p>
              <p className="muted">{used} usados de {limit}</p>
              <div className="bar">
                <i style={{ width: `${pct(used as number, limit as number)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabase-server";
import { getEntitlements } from "../../lib/entitlements";

type Level = {
  id: string;
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

  const { data: levels, error: levelsError } = await supabase
    .from("levels")
    .select(
      "id, level_number, slug, title, description, estimated_hours"
    )
    .order("level_number", { ascending: true });

  const learningLevels = (levels ?? []) as Level[];

  const totalHours = learningLevels.reduce(
    (sum, level) => sum + (level.estimated_hours ?? 0),
    0
  );

  const pct = (used: number, limit: number) =>
    limit < 0
      ? 0
      : Math.min(
          100,
          Math.round((used / Math.max(1, limit)) * 100)
        );

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">{ent.plan_name}</span>
          <h1>Mi CodeZero</h1>
          <p className="muted">
            De cero a construir soluciones técnicas para SaaS.
          </p>
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
          <div className="stat">0%</div>
        </div>
      </div>

      {levelsError && (
        <div className="card" style={{ marginTop: 18 }}>
          <b>No se pudieron cargar los niveles.</b>
          <p className="muted">{levelsError.message}</p>
        </div>
      )}

      <section style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <span className="pill">RUTA DE APRENDIZAJE</span>
            <h2 style={{ marginBottom: 6 }}>Tu camino en CodeZero</h2>
            <p className="muted" style={{ margin: 0 }}>
              Completa los 15 niveles desde fundamentos hasta integraciones
              empresariales.
            </p>
          </div>

          <div className="muted">
            {learningLevels.length} niveles · {totalHours} horas
          </div>
        </div>

        <div className="grid grid2">
          {learningLevels.map((level) => (
            <div className="card" key={level.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div>
                  <span className="pill">NIVEL {level.level_number}</span>

                  <h3 style={{ marginBottom: 8 }}>{level.title}</h3>

                  <p className="muted">
                    {level.description ??
                      "Continúa desarrollando tus habilidades técnicas."}
                  </p>
                </div>

                <b>{level.estimated_hours ?? 0}h</b>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span className="muted">Progreso</span>
                  <span className="muted">0%</span>
                </div>

                <div className="bar">
                  <i style={{ width: "0%" }} />
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <Link
                  className="btn secondary"
                  href={`/courses/codezero/${level.slug}`}
                >
                  Entrar al nivel
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Uso mensual</h2>

        <div className="grid grid2">
          {[
            [
              "Ejercicios",
              usage.exercises ?? 0,
              ent.exercise_limit,
            ],
            [
              "Exámenes",
              usage.exams ?? 0,
              ent.exam_limit,
            ],
            [
              "IA Tutor",
              usage.ai_queries ?? 0,
              ent.ai_query_limit,
            ],
            [
              "Proyectos",
              usage.projects ?? 0,
              ent.project_limit,
            ],
          ].map(([name, used, limit]) => (
            <div className="card" key={name as string}>
              <p>
                <b>{name}</b>
              </p>

              <p className="muted">
                {used} usados de {limit}
              </p>

              <div className="bar">
                <i
                  style={{
                    width: `${pct(
                      used as number,
                      limit as number
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


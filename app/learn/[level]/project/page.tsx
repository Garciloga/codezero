import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { getPassedLevelNumbers, isLevelIncludedInPlan, isLevelUnlocked } from "../../../../lib/learning";

type PageProps = {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ submitted?: string }>;
};

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { level } = await params;
  const { submitted } = await searchParams;
  const levelNumber = Number(level);

  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 15) notFound();

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, plan_name")
    .eq("id", user.id)
    .single();

  if (!isLevelIncludedInPlan(levelNumber, profile?.plan_name ?? "free", profile?.role)) {
    redirect("/pricing");
  }

  const passedLevels = await getPassedLevelNumbers(user.id);
  if (!isLevelUnlocked(levelNumber, passedLevels)) {
    redirect("/dashboard");
  }

  const { data: currentLevel } = await supabase
    .from("levels")
    .select("id, level_number, title")
    .eq("level_number", levelNumber)
    .single();

  if (!currentLevel) notFound();

  const { data: project } = await supabase
    .from("level_projects")
    .select("id, title, brief, requirements")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .maybeSingle();

  if (!project) notFound();

  const { data: submissions } = await supabase
    .from("project_submissions")
    .select("id, submission_text, status, score, feedback, created_at")
    .eq("user_id", user.id)
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = submissions?.[0];

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">PROYECTO · NIVEL {levelNumber}</span>
          <h1>{project.title}</h1>
          <p className="muted">{project.brief}</p>
        </div>
        <Link className="btn secondary" href={`/learn/${levelNumber}`}>Volver al nivel</Link>
      </div>

      {submitted === "1" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Proyecto enviado.</b>
          <p className="muted" style={{ marginBottom: 0 }}>Tu entrega quedó registrada para revisión.</p>
        </div>
      )}

      <div className="grid grid2">
        <section className="card">
          <h2>Requisitos</h2>
          <ol style={{ lineHeight: 1.8 }}>
            {(project.requirements ?? []).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="card">
          <h2>Tu entrega</h2>
          {latest && latest.status !== "needs_revision" ? (
            <>
              <p className="muted">Estado: {latest.status}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{latest.submission_text}</p>
              {latest.score != null && <p><b>Puntuación:</b> {latest.score}</p>}
              {latest.feedback && <p><b>Feedback:</b> {latest.feedback}</p>}
            </>
          ) : (
            <>
              {latest?.status === "needs_revision" && (
                <div style={{ marginBottom: 14 }}>
                  <p><b>Se requieren cambios antes de aprobar el proyecto.</b></p>
                  {latest.feedback && <p className="muted">{latest.feedback}</p>}
                </div>
              )}
              <form action="/api/projects/submit" method="post">
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="level_number" value={levelNumber} />
              <textarea
                name="submission_text"
                required
                minLength={50}
                rows={12}
                placeholder="Describe tu solución, decisiones técnicas, enlaces relevantes y cómo verificaste que funciona."
                style={{ width: "100%", padding: 14, border: "1px solid #d8dee8", borderRadius: 12, font: "inherit" }}
              />
              <button className="btn" type="submit" style={{ marginTop: 14 }}>
                {latest?.status === "needs_revision" ? "Reenviar proyecto" : "Enviar proyecto"}
              </button>
            </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

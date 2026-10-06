import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../../lib/supabase-server";

type PageProps = {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ result?: string; score?: string }>;
};

export default async function ExamPage({ params, searchParams }: PageProps) {
  const { level } = await params;
  const { result, score } = await searchParams;
  const levelNumber = Number(level);

  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 15) notFound();

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentLevel } = await supabase
    .from("levels")
    .select("id, level_number, title")
    .eq("level_number", levelNumber)
    .single();

  if (!currentLevel) notFound();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("level_id", currentLevel.id)
    .eq("status", "published");

  const lessonIds = (lessons ?? []).map((x: any) => x.id);
  let completed = 0;

  if (lessonIds.length > 0) {
    const { data: rows } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .in("lesson_id", lessonIds);
    completed = rows?.length ?? 0;
  }

  if (lessonIds.length === 0 || completed < lessonIds.length) {
    redirect(`/learn/${levelNumber}`);
  }

  const { data: project } = await supabase
    .from("level_projects")
    .select("id")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .maybeSingle();

  if (project) {
    const { data: submissions } = await supabase
      .from("project_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .limit(1);

    if ((submissions?.length ?? 0) === 0) {
      redirect(`/learn/${levelNumber}/project`);
    }
  }

  const { data: exam } = await supabase
    .from("level_exams")
    .select("id, title, description, passing_score")
    .eq("level_id", currentLevel.id)
    .eq("status", "published")
    .single();

  if (!exam) notFound();

  const { data: questions } = await supabase
    .from("exam_questions")
    .select("id, prompt, options, sort_order")
    .eq("exam_id", exam.id)
    .order("sort_order", { ascending: true });

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("score, passed, created_at")
    .eq("user_id", user.id)
    .eq("exam_id", exam.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = attempts?.[0];

  return (
    <main className="wrap">
      <div className="nav">
        <div>
          <span className="pill">EVALUACIÓN · NIVEL {levelNumber}</span>
          <h1>{exam.title}</h1>
          <p className="muted">{exam.description}</p>
        </div>
        <Link className="btn secondary" href={`/learn/${levelNumber}`}>Volver al nivel</Link>
      </div>

      {result && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>{result === "passed" ? "Evaluación aprobada" : result === "failed" ? "Evaluación no aprobada" : "No fue posible enviar la evaluación"}</b>
          {score && <p className="muted" style={{ marginBottom: 0 }}>Puntuación: {score}%</p>}
        </div>
      )}

      {latest?.passed && (
        <div className="card" style={{ marginBottom: 20 }}>
          <b>Nivel aprobado.</b>
          <p className="muted" style={{ marginBottom: 0 }}>
            Tu mejor avance ya permite desbloquear el siguiente nivel.
          </p>
        </div>
      )}

      <form action="/api/exams/submit" method="post">
        <input type="hidden" name="exam_id" value={exam.id} />
        <input type="hidden" name="level_number" value={levelNumber} />

        <div style={{ display: "grid", gap: 18 }}>
          {(questions ?? []).map((question: any, qIndex: number) => (
            <div className="card" key={question.id}>
              <h3>{qIndex + 1}. {question.prompt}</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {(question.options ?? []).map((option: string, index: number) => {
                  const labels = ["A", "B", "C", "D"];
                  return (
                    <label key={index} style={{ display: "flex", gap: 10, padding: 12, border: "1px solid #e5e9f0", borderRadius: 12 }}>
                      <input type="radio" name={`q_${question.id}`} value={labels[index]} required />
                      <span><b>{labels[index]}.</b> {option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn" type="submit">Enviar evaluación</button>
        </div>
      </form>
    </main>
  );
}

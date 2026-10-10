import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOwner, createAdminSupabase } from "../../../lib/admin";
import { getServerUser } from "../../../lib/supabase-server";
import { POSITION_PROGRAMS, DEFAULT_POSITION } from "../../../lib/position-curriculum";
import { COMPETENCIES } from "../../../lib/competency-matrix";
import { localeContext, serverTranslator } from "../../../lib/localization/server";
import { ownerCopy } from "../../../lib/localization/owner-inspector";
import { copyForPilot } from "../../../lib/localization/assessment-pilot";
import LocalizedContent from "../../components/localization/server";

export const dynamic = "force-dynamic";

type Query = { track?: string; position?: string; level?: string; item?: string };
type Props = { searchParams: Promise<Query> };

export default async function OwnerCurriculumInspector({ searchParams }: Props) {
  const { data: { user } } = await getServerUser();
  if (!user) redirect("/login");
  try { await requireOwner(user.id); } catch { notFound(); }

  // No writes, no student impersonation, no fake progress or unlocked certificates.
  const query = await searchParams;
  const { locale } = await localeContext();
  const copy = ownerCopy(locale);
  const pilotTitle=copyForPilot(locale).heading;
  const t = await serverTranslator();
  const chosenLevel = Number(query.level);
  const level = Number.isInteger(chosenLevel) && chosenLevel >= 1 && chosenLevel <= 15 ? chosenLevel : 1;
  const technical = query.track === "technical";
  const program = POSITION_PROGRAMS[query.position ?? ""] ?? POSITION_PROGRAMS[DEFAULT_POSITION];
  const link = (position: string, n: number, item?: string) =>
    "/admin/curriculum?" + new URLSearchParams({
      position, level: String(n), ...(item ? { item } : {}),
    }).toString();
  const localized = (v: Record<string, string> | undefined) => v?.[locale] ?? v?.es ?? "";

  if (!technical) {
    const levelInfo = program.levels.find(x => x.number === level);
    const items = [
      ...program.lessons.filter(x => x.level === level),
      ...program.exams.filter(x => x.level === level),
      ...program.projects.filter(x => x.level === level),
    ];
    const item = items.find(x => x.key === query.item) ?? items[0];
    const application = item?.application?.[locale] ?? item?.application?.es;
    const decisions = application?.decisions ?? item?.decisions ?? [];

    return <LocalizedContent><main className="wrap">
      <div className="nav">
        <div><span className="pill">{copy.owner}</span><h1>{copy.title}</h1>
          <p className="muted">{copy.intro}</p></div>
        <Link className="btn secondary" href="/admin">{copy.back}</Link>
      </div>
      <nav className="card" aria-label={copy.programs}>
        <h2>{copy.choose}</h2>
        <div className="public-actions">
          {Object.values(POSITION_PROGRAMS).map(p =>
            <Link key={p.key} className={"btn " + (p.key === program.key ? "" : "secondary")} href={link(p.key, 1)}>{p.title}</Link>)}
          <Link className="btn secondary" href="/admin/curriculum?track=technical&level=1">{copy.technical}</Link>
          <Link className="btn secondary" href="/admin/assessments-pilot">{pilotTitle}</Link>
        </div>
      </nav>
      <section className="card">
        <span className="pill">{program.editorialReview === "approved" ? "{copy.editorialApproved}" : "{copy.editorialPending}"}</span>
        <h2>{program.title} {copy.levels15}</h2>
        <div className="public-actions">
          {program.levels.map(n => <Link key={n.number} className={"btn " + (n.number === level ? "" : "secondary")} href={link(program.key, n.number)}>{copy.level} {n.number}</Link>)}
        </div>
        <h3>{copy.level} {level}: {localized(levelInfo?.title)}</h3>
        <p className="muted">{items.length} {copy.elements}</p>
        <div className="public-actions">
          {items.map(x => <Link key={x.key} className={"btn " + (x.key === item?.key ? "" : "secondary")} href={link(program.key, level, x.key)}>
            {x.type === "lesson" ? copy.lesson + " " + x.lesson : x.type === "exam" ? copy.exam : copy.project}
          </Link>)}
        </div>
      </section>
      {item && <section className="card">
        <span className="pill">{item.type.toUpperCase()} {copy.levelTag} {item.level}</span>
        <h2>{localized(item.title)}</h2>
        <p><b>{copy.key}</b> <code>{item.key}</code></p>
        <h3>{copy.context}</h3>
        {application?.case && <p style={{ whiteSpace: "pre-wrap" }}>{application.case}</p>}
        <p style={{ whiteSpace: "pre-wrap" }}>{t(item.source.lesson)}</p>
        {application?.task && <><h3>{copy.work}</h3><p style={{ whiteSpace: "pre-wrap" }}>{application.task}</p></>}
        {localized(item.brief) && <p style={{ whiteSpace: "pre-wrap" }}>{localized(item.brief)}</p>}
        {application?.rule && <p><b>{copy.rubric}</b> {application.rule}</p>}
        {application?.evidence && <p><b>{copy.evidence}</b> {application.evidence}</p>}
        {application?.template && <details><summary>{copy.template}</summary><p style={{ whiteSpace: "pre-wrap" }}>{application.template}</p></details>}
        {application?.example && <details><summary>{copy.example}</summary><p style={{ whiteSpace: "pre-wrap" }}>{application.example}</p></details>}
        {item.source.rubric?.length > 0 && <><h3>{copy.projectCriteria}</h3><ul>{item.source.rubric.map((r, i) => <li key={i}>{t(r)}</li>)}</ul></>}
        {decisions.length > 0 && <><h3>{copy.decisions}</h3>
          {decisions.map((d, i) => <div key={i} className="card">
            <h4>{i + 1}. {d.prompt}</h4>
            <ol>{d.options.map((option, j) => <li key={j}>{option} {j === d.correct && <strong> {copy.expected}</strong>}</li>)}</ol>
            <p className="muted">{d.feedback}</p>
          </div>)}</>}
        <h3>{copy.competencies}</h3>
        <ul>{item.source.competencies.map(key => <li key={key}>{t(COMPETENCIES[key])}</li>)}</ul>
        <p className="muted">{copy.readOnly}</p>
      </section>}
    </main></LocalizedContent>;
  }

  // Technical courses are database-backed. Read using a service-role client only
  // AFTER the owner identity has been independently verified on the server.
  const db = createAdminSupabase();
  const { data: levels, error: levelsError } = await db.from("levels")
    .select("id,level_number,title,description,status").order("level_number");
  if (levelsError) throw new Error("OWNER_CURRICULUM_UNAVAILABLE");
  const selected = levels?.find(x => Number(x.level_number) === level);
  if (!selected) notFound();
  const [lessonQuery, examQuery, projectQuery] = await Promise.all([
    db.from("lessons").select("id,title,description,content,sort_order,status").eq("level_id", selected.id).order("sort_order"),
    db.from("level_exams").select("id,title,description,passing_score,status").eq("level_id", selected.id),
    db.from("level_projects").select("id,title,brief,requirements,status").eq("level_id", selected.id),
  ]);
  if (lessonQuery.error || examQuery.error || projectQuery.error) throw new Error("OWNER_CURRICULUM_UNAVAILABLE");
  const lessons = lessonQuery.data ?? [];
  const exams = examQuery.data ?? [];
  const projects = projectQuery.data ?? [];
  const lessonIds = lessons.map(x => x.id);
  const examIds = exams.map(x => x.id);
  const [exerciseQuery, questionQuery] = await Promise.all([
    lessonIds.length ? db.from("exercises").select("id,lesson_id,prompt,options,kind,status").in("lesson_id", lessonIds) : Promise.resolve({ data: [], error: null }),
    examIds.length ? db.from("exam_questions").select("id,exam_id,prompt,options,sort_order").in("exam_id", examIds).order("sort_order") : Promise.resolve({ data: [], error: null }),
  ]);
  if (exerciseQuery.error || questionQuery.error) throw new Error("OWNER_CURRICULUM_UNAVAILABLE");
  const questionIds = (questionQuery.data ?? []).map(q => q.id);
  const solutions = questionIds.length
    ? await db.from("exam_solutions").select("question_id,correct_answer").in("question_id", questionIds)
    : { data: [], error: null };
  if (solutions.error) throw new Error("OWNER_CURRICULUM_UNAVAILABLE");
  const solutionsById = new Map((solutions.data ?? []).map(x => [x.question_id, x.correct_answer]));

  return <LocalizedContent><main className="wrap">
    <div className="nav"><div><span className="pill">{copy.owner}</span>
      <h1>{copy.technical}</h1>
      <p className="muted">{copy.techIntro}</p></div>
      <Link className="btn secondary" href="/admin">{copy.back}</Link></div>
    <section className="card">
      <Link className="btn secondary" href="/admin/curriculum">{copy.backPrograms}</Link>
      <Link className="btn secondary" href="/admin/assessments-pilot">{pilotTitle}</Link>
      <h2>{copy.chooseLevel}</h2>
      <div className="public-actions">{(levels ?? []).map(x =>
        <Link key={x.id} className={"btn " + (Number(x.level_number) === level ? "" : "secondary")}
          href={"/admin/curriculum?track=technical&level=" + x.level_number}>{copy.level} {x.level_number}</Link>)}</div>
      <h3>{copy.level} {selected.level_number}: {selected.title}</h3>
      <p>{selected.description}</p><p className="muted">{copy.editorialState} {selected.status}</p>
    </section>
    {lessons.map((lesson, i) => <details key={lesson.id} className="card">
      <summary><b>{copy.lesson} {i + 1}: {lesson.title}</b> · {lesson.status}</summary>
      <p>{lesson.description}</p><p style={{ whiteSpace: "pre-wrap" }}>{lesson.content}</p>
      <h3>{copy.exercise}</h3>
      {(exerciseQuery.data ?? []).filter(e => e.lesson_id === lesson.id).map(e =>
        <div key={e.id}><p><b>{e.kind}:</b> {e.prompt}</p>
          {Array.isArray(e.options) ? <ol>{e.options.map((o: unknown, i: number) => <li key={i}>{String(o)}</li>)}</ol> : null}
        </div>)}
    </details>)}
    {exams.map(exam => <details key={exam.id} className="card"><summary><b>{copy.examPrefix} {exam.title}</b> · {exam.status}</summary>
      <p>{exam.description}</p><p>{copy.passScore} {exam.passing_score}</p>
      {(questionQuery.data ?? []).filter(q => q.exam_id === exam.id).map((q, i) =>
        <div key={q.id}><h4>{i + 1}. {q.prompt}</h4>
          {Array.isArray(q.options) && <ol>{q.options.map((o: unknown, j: number) => <li key={j}>{String(o)}</li>)}</ol>}
          <p><b>{copy.answerKey}</b> {String(solutionsById.get(q.id) ?? copy.notRegistered)}</p>
        </div>)}
    </details>)}
    {projects.map(project => <details key={project.id} className="card"><summary><b>{copy.projectPrefix} {project.title}</b> · {project.status}</summary>
      <p>{project.brief}</p><ul>{(project.requirements ?? []).map((req: string, i: number) => <li key={i}>{req}</li>)}</ul>
    </details>)}
    <p className="muted">{copy.technicalFoot}</p>
  </main></LocalizedContent>;
}

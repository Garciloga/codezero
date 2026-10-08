import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "../../../lib/supabase-server";
import { createAdminSupabase } from "../../../lib/admin";
import { canIssueBlockDiploma } from "../../../lib/block-diplomas";
import PrintDiploma from "../../components/print-diploma";
import BlockDiplomaDocument from "../../components/block-diploma-document";
import { workspaceEnabled } from "../../../lib/workspace-sandbox";
import "../diploma.css";
export async function generateMetadata() { return translatedMetadata({ title: "Diploma de bloque", robots: { index: false, follow: false } }); }
function Diploma({level,name,title,id,issuedAt,canSave}: {level:number;name:string;title:string;id?:string;issuedAt?:string;canSave?:boolean}) {
  return <LocalizedContent><main className="wrap diploma-page">
    <div className="diploma-controls"><Link className="btn secondary" href="/dashboard">Volver a Mi Garciloga</Link><PrintDiploma />
      {canSave && <form action="/api/diplomas/issue" method="post"><input type="hidden" name="level" value={level}/><button className="btn" type="submit">Guardar diploma en mi cuenta</button></form>}
    </div>
    <BlockDiplomaDocument level={level} name={name} title={title} id={id} issuedAt={issuedAt}/>
  </main></LocalizedContent>;
}
export default async function BlockDiplomaPage({ params, searchParams }: { params: Promise<{ level: string }>; searchParams: Promise<{saved?:string}> }) {
  const { level } = await params;
  if (!/^([1-9]|1[0-5])$/.test(level)) notFound();
  const supabase = await createServerSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");
  const sandbox = workspaceEnabled();
  if (sandbox) {
    const {data:saved,error} = await supabase.from("issued_block_diplomas").select("id,learner_name,block_title,issued_at,level_number").eq("user_id",user.id).eq("level_number",Number(level)).maybeSingle();
    if (error) return <LocalizedContent><main className="wrap"><h1>No pudimos consultar tus diplomas</h1><p>Intenta nuevamente.</p></main></LocalizedContent>;
    if (saved) return <LocalizedContent><Diploma level={saved.level_number} name={saved.learner_name} title={saved.block_title} id={saved.id} issuedAt={saved.issued_at}/></LocalizedContent>;
    if ((await searchParams).saved === "failed") return <LocalizedContent><main className="wrap"><h1>No pudimos guardar tu diploma</h1><p>Verifica los requisitos e intenta nuevamente.</p><Link href={`/diplomas/${level}`}>Revisar bloque</Link></main></LocalizedContent>;
  }
  // Only public curriculum requirements use the server catalog reader. A plan
  // filter must not hide a required project and accidentally grant a diploma.
  // Learner evidence remains scoped to the verified user through existing RLS.
  if (!process.env.SUPABASE_SECRET_KEY) return <LocalizedContent><main className="wrap"><h1>No pudimos comprobar el bloque</h1><p>La emisión está pendiente de configuración. No se emitió un diploma.</p></main></LocalizedContent>;
  const catalog = createAdminSupabase();
  const { data: block, error: blockError } = await catalog.from("levels").select("id,title,level_number").eq("level_number", Number(level)).eq("status","published").single();
  if (blockError || !block) notFound();
  const results = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    catalog.from("lessons").select("id").eq("level_id", block.id).eq("status", "published"),
    catalog.from("level_exams").select("id").eq("level_id", block.id).eq("status","published"),
    catalog.from("level_projects").select("id").eq("level_id", block.id).eq("status", "published"),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).eq("status", "completed"),
    supabase.from("exam_attempts").select("exam_id").eq("user_id", user.id).eq("passed", true),
    supabase.from("project_submissions").select("project_id").eq("user_id", user.id).eq("status", "approved"),
  ]);
  const [profile, lessons, exams, projects, progress, attempts, approvals] = results;
  if (results.some(result => result.error)) {
    return <LocalizedContent><main className="wrap"><h1>No pudimos comprobar el bloque</h1><p>Intenta nuevamente. No se emitió un diploma.</p><Link href="/dashboard">Volver al panel</Link></main></LocalizedContent>;
  }
  const eligible = canIssueBlockDiploma({
    lessonIds: (lessons.data ?? []).map(row => Number(row.id)),
    completedLessonIds: (progress.data ?? []).map(row => Number(row.lesson_id)),
    examIds: (exams.data ?? []).map(row => Number(row.id)),
    passedExamIds: (attempts.data ?? []).map(row => Number(row.exam_id)),
    projectIds: (projects.data ?? []).map(row => Number(row.id)),
    approvedProjectIds: (approvals.data ?? []).map(row => Number(row.project_id)),
  });
  if (!eligible) return <LocalizedContent><main className="wrap"><h1>Tu diploma de bloque</h1><p>Completa todas las lecciones publicadas, aprueba el examen y consigue aprobación del proyecto si este bloque lo requiere.</p><Link className="btn secondary" href={`/learn/${level}`}>Volver al bloque</Link></main></LocalizedContent>;
  return <LocalizedContent><Diploma level={block.level_number} name={profile.data?.full_name || "Estudiante Garciloga"} title={block.title} canSave={sandbox}/></LocalizedContent>;
}


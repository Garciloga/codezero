import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import PracticeLearningPreview from "../../components/practice-learning-preview";
import BrowserCodePractice from "../../components/browser-code-practice";
import { codeRuntimeConfiguration } from "../../../lib/code-runtime-policy";

import { workspaceSandboxEnabled } from "../../../lib/workspace-sandbox";
import { workspaceUser } from "../../../lib/workspace-server";
import { validPracticeProgress } from "../../../lib/practice-progress";

export async function generateMetadata() { return translatedMetadata({ title: "Práctica guiada · revisión CodeZero", robots: { index: false, follow: false } }); }
export const dynamic = "force-dynamic";
export default async function PracticePreview({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  if (process.env.CODEZERO_PRACTICE_PREVIEW !== "1") notFound();
  const { level } = await searchParams;
  const initialLevel = level === undefined ? null : Number(level);
  if (initialLevel !== null && (!/^(?:[1-9]|1[0-5])$/.test(level ?? "") || !Number.isInteger(initialLevel))) notFound();
  const runtime = codeRuntimeConfiguration(process.env);
  let saved = null;
  let persistence = false;
  let viewerIdentity = "guest";
  if (workspaceSandboxEnabled()) {
    const session = await workspaceUser();
    if (session) {
      viewerIdentity = session.user.id;
      const { data, error } = await session.supabase.from("private_practice_progress").select("progress,revision").eq("user_id", session.user.id).maybeSingle();
      persistence = !error && (!data || validPracticeProgress(data.progress));
      if (persistence && data) saved = { progress: data.progress, revision: data.revision };
    }
  }
  return <LocalizedContent><main className="wrap"><span className="pill">VISTA DE REVISIÓN · DATOS FICTICIOS</span>
    <h1>Practica lo que harías en un equipo SaaS</h1><p>Ordena pasos, completa código, detecta errores y diagnostica integraciones.</p>
    {runtime ? <BrowserCodePractice {...runtime} /> : <p>La ejecución de Python y SQL requiere el motor de revisión local; aquí puedes explorar las muestras guiadas.</p>}
    <PracticeLearningPreview key={viewerIdentity} initialLevel={initialLevel} persistence={persistence} saved={saved} />
    <p><Link className="btn secondary" href="/dashboard">Volver a Mi CodeZero</Link></p>
  </main></LocalizedContent>;
}


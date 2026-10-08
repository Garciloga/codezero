import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PracticeLearningPreview from "../components/practice-learning-preview";
import RoleCasePractice from "../components/role-case-practice";
import PracticeEvidenceReview from "../components/practice-evidence-review";
import BrowserCodePractice from "../components/browser-code-practice";
import { codeRuntimeConfiguration } from "../../lib/code-runtime-policy";
import { workspaceEnabled } from "../../lib/workspace-sandbox";
import { workspaceUser } from "../../lib/workspace-server";
import { validPracticeProgress } from "../../lib/practice-progress";
export async function generateMetadata() { return translatedMetadata({ title: "Práctica y decisiones", robots: { index: false, follow: false } }); }
export default async function PracticePage() {
 if (!workspaceEnabled()) notFound();
 const session = await workspaceUser(); if (!session) redirect("/login");
 const {data,error}=await session.supabase.from("private_practice_progress").select("progress,revision").eq("user_id",session.user.id).maybeSingle();
 const persistence=!error && (!data || validPracticeProgress(data.progress));
 const saved=persistence && data ? {progress:data.progress,revision:data.revision}:null;
 const runtime=codeRuntimeConfiguration(process.env);
 return <LocalizedContent><main className="wrap"><span className="pill">PRÁCTICA GUIADA</span><h1>Elige tu camino y practica decisiones</h1>
 <p>Trabaja con casos ficticios de Customer Success, soporte e integraciones. Este progreso es privado y no sustituye las evaluaciones del curso.</p>
 <PracticeLearningPreview key={session.user.id} initialLevel={null} persistence={persistence} saved={saved}/><RoleCasePractice/><PracticeEvidenceReview/>
 {runtime && <BrowserCodePractice {...runtime}/>}
 <p><Link href="/dashboard" className="btn secondary">Volver a Mi Garciloga</Link></p></main></LocalizedContent>;
}


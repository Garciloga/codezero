import { translatedMetadata } from '../../lib/localization/metadata';
import LocalizedContent from "../components/localization/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceSandboxEnabled } from "../../lib/workspace-sandbox";
import { workspaceUser } from "../../lib/workspace-server";
import TutorContextPreview from "../components/tutor-context-preview";
import TutorCostEstimate from "../components/tutor-cost-estimate";
export async function generateMetadata() { return translatedMetadata({title:"Revisión del contexto del Tutor",robots:{index:false,follow:false}}); }
export const dynamic="force-dynamic";
export default async function TutorPreview({searchParams}:{searchParams:Promise<{lesson?:string}>}){
 if(!workspaceSandboxEnabled() || process.env.CODEZERO_TUTOR_PREVIEW!=="1")notFound();
 const {lesson}=await searchParams;
 const lessonId=lesson===undefined?null:Number(lesson);
 if(lesson!==undefined && (!/^[1-9][0-9]*$/.test(lesson)||!Number.isSafeInteger(lessonId)))notFound();
 const session=await workspaceUser();
 return <LocalizedContent><main className="wrap"><span className="pill">REVISIÓN DE TUTOR · SIN LLAMADAS DE IA</span><h1>Ayuda con el contexto de tu lección</h1>
 <p>Esta revisión comprueba la lección, el acceso y la práctica registrada en tu cuenta. Prepara el contexto; todavía no genera respuestas de IA ni consume cuotas.</p>
 {session?<TutorContextPreview key={session.user.id} lessonId={lessonId}/>:<section className="card"><h2>Inicia sesión en el entorno de pruebas</h2><p>Tu contexto de aprendizaje requiere una cuenta activa. No se utilizan datos ficticios para simular tu avance.</p><Link className="btn" href="/login">Iniciar sesión</Link></section>}
 <TutorCostEstimate/>
 <p><Link className="btn secondary" href="/dashboard">Volver a Mi Garciloga</Link></p></main></LocalizedContent>;
}


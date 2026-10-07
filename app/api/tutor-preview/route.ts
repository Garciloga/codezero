import { workspaceSandboxEnabled, trustedWorkspaceMutation } from "../../../lib/workspace-sandbox";
import { workspaceUser } from "../../../lib/workspace-server";
import { tutorContextStore } from "../../../lib/tutor-context-server";
import { parseTutorInput, loadTutorContext, buildTutorDraft, TutorContextError } from "../../../lib/tutor-context";
export async function POST(req:Request){
 const reply=(body:object,status:number)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
 if(!workspaceSandboxEnabled() || process.env.CODEZERO_TUTOR_PREVIEW!=="1")return reply({error:"No disponible"},404);
 if(!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL))return reply({error:"Origen no permitido"},403);
 const session=await workspaceUser();if(!session)return reply({error:"Inicia sesión con una cuenta activa de pruebas"},401);
 const raw=await req.text();if(raw.length>10000)return reply({error:"Solicitud demasiado grande"},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:"JSON inválido"},400);}
 const input=parseTutorInput(body);if(!input)return reply({error:"Envía únicamente una lección y una pregunta válida"},400);
 try{
  const context=await loadTutorContext(tutorContextStore(session.supabase,session.user.id,session.profile),input.lessonId);
  const draft=buildTutorDraft(context,input.question);
  // Intentionally no provider request, quota RPC, credentials or writes in this preview.
  return reply({mode:"preparation_only",context,draft,notice:"Contexto preparado. No se llamó a la IA ni se consumió cuota."},200);
 }catch(error){
  if(error instanceof TutorContextError)return reply({error:error.code},error.code==="ACCESS_DENIED"||error.code==="ACCOUNT_INACTIVE"?403:error.code==="CONTEXT_UNAVAILABLE"?503:404);
  return reply({error:"No pudimos comprobar el contexto completo; intenta nuevamente"},503);
 }
}

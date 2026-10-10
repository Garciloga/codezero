import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import LocalizedContent from "../../components/localization/server";
import {workspaceUser} from "../../../lib/workspace-server";
import {workspaceSandboxEnabled} from "../../../lib/workspace-sandbox";
import {draftCourseAssignmentsEnabled} from "../../../lib/draft-course-assignment-policy";
export const dynamic="force-dynamic";
export const metadata={title:"Progreso de decisiones en borrador · Garciloga",robots:{index:false,follow:false}};
type Assignment={id:string;course_key:string;competency:string;emphasis:string;organization_id:string};
type Decision={id:string;assignment_id:string;level_number:number;unit_number:number;phase_number:number;revision:number;status:string;option_key:string};
const indexOfDecision=(d:{level_number:number;unit_number:number;phase_number:number})=>(d.level_number-1)*18+(d.unit_number-1)*3+(d.phase_number-1);
export default async function DraftProgress(){
 if(!workspaceSandboxEnabled()||!draftCourseAssignmentsEnabled())notFound();
 const ctx=await workspaceUser();if(!ctx)redirect("/login");
 const [a,d]=await Promise.all([
  ctx.supabase.from("organization_course_assignment_drafts").select("id,course_key,competency,emphasis,organization_id").eq("user_id",ctx.user.id).eq("status","draft"),
  ctx.supabase.from("organization_course_decision_drafts").select("id,assignment_id,level_number,unit_number,phase_number,revision,status,option_key").eq("user_id",ctx.user.id).order("level_number").order("unit_number").order("phase_number")
 ]);
 if(a.error||d.error) return <LocalizedContent><main className="wrap"><h1>Práctica de decisiones · Borrador</h1><p>La base de pruebas no está preparada para cargar tus entregas.</p></main></LocalizedContent>;
 const assignments=(a.data??[]) as Assignment[],decisions=(d.data??[]) as Decision[];
 return <LocalizedContent><main className="wrap">
  <header className="nav"><div><span className="pill">Solo sandbox · Borrador</span><h1>Decisiones, revisiones y evidencia</h1><p>Esta prueba guarda decisiones y revisiones en un entorno aislado. No acredita un curso, no cambia tus certificados ni sustituye las cinco prácticas por unidad.</p></div><Link prefetch={false} href="/dashboard" className="btn secondary">Ir al panel</Link></header>
  {assignments.length===0&&<section className="card"><p>No tienes asignaciones de prueba activas. Un responsable autorizado puede crear una desde tu ficha de empresa.</p></section>}
  {assignments.map(assignment=>{
   const steps=decisions.filter(x=>x.assignment_id===assignment.id),byPos=new Map(steps.map(x=>[indexOfDecision(x),x]));
   let next=0;while(next<270&&byPos.get(next)?.status==="approved")next++;
   const current=byPos.get(next),level=Math.floor(next/18)+1,unit=Math.floor((next%18)/3)+1,phase=next%3+1;
   return <section className="card" key={assignment.id}>
    <h2>{assignment.course_key.replaceAll("_"," ")}</h2><p>Competencia principal: {assignment.competency} · Intensidad: {assignment.emphasis}</p>
    <p>Decisiones aprobadas en esta simulación: {steps.filter(x=>x.status==="approved").length}/270. Esto no equivale al progreso académico publicado.</p>
    {steps.length>0&&<ul>{steps.slice(-8).map(x=><li key={x.id}>N{x.level_number} U{x.unit_number} F{x.phase_number} — {x.status==="approved"?"Revisión aprobada":x.status==="needs_changes"?"Requiere cambios":"Pendiente de revisión"} · intento {x.revision}</li>)}</ul>}
    {next>=270?<p>Secuencia de decisiones revisada. Faltan cinco prácticas y el proyecto final para cualquier aprobación académica real.</p>:current?.status==="submitted"?<p>La entrega está pendiente de revisión independiente. No puedes desbloquear la siguiente fase todavía.</p>:
    <form action="/api/learn/draft-decision" method="post">
     <h3>{current?.status==="needs_changes"?"Corrección requerida":"Siguiente decisión"}: Nivel {level}, Unidad {unit}, Fase {phase}</h3>
     <p>Usa el caso académico correspondiente a tu ruta, contrasta hechos y alternativas, y explica las consecuencias de la opción elegida.</p>
     <input type="hidden" name="assignment_id" value={assignment.id}/>
     <input type="hidden" name="level" value={level}/><input type="hidden" name="unit" value={unit}/><input type="hidden" name="phase" value={phase}/>
     <label>Alternativa seleccionada<select name="option_key" required defaultValue=""><option value="" disabled>Elegir opción</option><option value="a">A</option><option value="b">B</option><option value="c">C</option></select></label>
     <label>Razonamiento, datos, riesgos y consecuencias<textarea name="reasoning" minLength={220} maxLength={6000} required rows={8}/></label>
     <label>Referencia verificable de evidencia<input type="text" name="evidence_reference" minLength={8} maxLength={300} required placeholder="ID de evidencia sintética, sin datos de clientes"/></label>
     <button className="btn">Enviar decisión para revisión</button>
    </form>}
   </section>;
  })}
 </main></LocalizedContent>;
}

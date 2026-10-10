import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {getServerUser} from "../../../../lib/supabase-server";
import {requireOwner} from "../../../../lib/admin";
import {DRAFT_CURRICULA,draftCourse,ADJACENT_DRAFTS,adjacentDraft} from "../../../../lib/draft-curricula";
import AdjacentDraftInspector from "./adjacent-draft-inspector";
import LocalizedContent from "../../../components/localization/server";
export const dynamic="force-dynamic";
export const metadata={title:"Borradores editoriales · Garciloga",robots:{index:false,follow:false}};
type Props={searchParams:Promise<{course?:string;level?:string}>};
export default async function DraftAcademicInspector({searchParams}:Props){
 const {data:{user}}=await getServerUser();if(!user)redirect("/login");
 try{await requireOwner(user.id);}catch{notFound();}
 const params=await searchParams;
 const adjacent=adjacentDraft(params.course);
 if(adjacent)return <LocalizedContent><AdjacentDraftInspector draft={adjacent} selected={Number(params.level)}/></LocalizedContent>;
 const course=draftCourse(params.course);
 const id=Number(params.level),level=course.levels.find(x=>x.number===id)??course.levels[0];
 const isGrc=course.key==="grc_advanced";
 const units=isGrc?"learningUnits" in level?level.learningUnits:[]:"lessons" in level?level.lessons:[];
 const exam="assessment" in level?level.assessment:"exam" in level?level.exam:null;
 const tasks=exam?("prompts" in exam?exam.prompts:exam.tasks):[];
 const rubric="capstone" in level?level.capstone:"project" in level?level.project:null;
 const href=(key:string,n:number)=>"/admin/curriculum/drafts?course="+encodeURIComponent(key)+"&level="+n;
 return <LocalizedContent><main className="wrap academic-draft-inspector">
 <div className="nav"><div><span className="pill">Borrador privado · Solo propietario</span><h1>Laboratorio editorial de cursos</h1><p>Contenido no publicado. Los nombres y respuestas de las decisiones son visibles aquí solamente para revisión; no forman parte de una API pública.</p></div><Link className="btn secondary" href="/admin/curriculum">Volver al inspector</Link></div>
 <section className="card"><h2>Cursos en borrador</h2><div className="public-actions">{Object.values(DRAFT_CURRICULA).map(c=><Link className={"btn "+(c.key===course.key?"":"secondary")} key={c.key} href={href(c.key,1)}>{c.title}</Link>)}{Object.values(ADJACENT_DRAFTS).map(c=><Link className="btn secondary" key={c.key} href={href(c.key,1)}>{c.title}</Link>)}</div>
 <p className="muted">Idioma base: español. EN/PT/FR pendientes de traducción y verificación nativa. No permite acreditar competencias, emitir diplomas ni activar el checkout.</p></section>
 <section className="card"><h2>{course.title}</h2><p>{course.levels.length} niveles · {course.levels.reduce((n,l)=>n+("learningUnits" in l?l.learningUnits.length:"lessons" in l?l.lessons.length:0),0)} unidades · revisión humana requerida.</p><div className="academic-draft-levels" aria-label="Seleccionar nivel">{course.levels.map(l=><Link key={l.id} href={href(course.key,l.number)} aria-current={level.number===l.number?"page":undefined} className={"btn "+(level.number===l.number?"":"secondary")}>{l.number}. {l.title}</Link>)}</div></section>
 <article className="card academic-draft-case"><span className="pill">Nivel {level.number} · {level.difficulty}</span><h2>{level.title}</h2><h3>Hechos del caso</h3><p>{level.case.facts}</p><h3>Conflicto que debe resolverse</h3><p>{level.case.conflict}</p><h3>Indicador de resultado</h3><p>{level.case.metric}</p><p>{level.case.continuity}</p></article>
 {"deepDive" in level&&<section className="card academic-draft-deep"><h2>Marco técnico avanzado</h2><p>{level.deepDive.concept}</p><h3>Ejemplo analítico trabajado</h3><p>{level.deepDive.workedExample}</p><h3>Preguntas adversariales de revisión</h3><ol>{level.deepDive.challengeQuestions.map(q=><li key={q}>{q}</li>)}</ol></section>}
 <section className="card"><h2>Prácticas de aprendizaje y evaluación</h2><p>Banco de actividades y criterios disponibles para el propietario, sin publicación a alumnos.</p><Link className="btn" href={"/admin/curriculum/drafts/practices?course="+encodeURIComponent(course.key)+"&level="+level.number}>Ver prácticas por unidad</Link></section>
 <section aria-label="Unidades de estudio"><h2>Aprendizaje y entregables</h2><div className="academic-draft-units">{units.map((u)=><article className="card" key={u.id}><h3>{u.title}</h3><p>{"teaching" in u?u.teaching:""}</p><h4>Ejercicio que exige evidencia</h4><p>{"exercise" in u?u.exercise:"task" in u?u.task:""}</p><p>Extensión mínima: {u.evidence.minWords} palabras, con revisión humana.</p><ul>{u.evidence.required.map(e=><li key={e}>{e}</li>)}</ul></article>)}</div></section>
 <section className="card"><h2>Decisiones y consecuencias del caso</h2><p>Estas claves son solo para el revisor; nunca deben salir en el contenido público de ejercicios ni en un endpoint de evaluación.</p>{level.decisions.map((d,i)=><div className="academic-draft-decision" key={i}><h3>Decisión {i+1}</h3><p>{d.prompt}</p><ol type="A">{d.options.map((option,n)=><li key={n}><span>{option}</span> {n===d.correctIndex&&<b> · criterio preferente</b>}</li>)}</ol><p>{d.feedback}</p></div>)}</section>
 <section className="card"><h2>Evaluación aplicada de nivel · revisión obligatoria</h2><p>Calificación mínima: 80/100. Cada respuesta debe explicar razonamiento, impacto, datos y alternativa descartada; escribir «terminé» no se considera evidencia.</p><p>Extensión total de referencia: {"minimumWords" in exam!?exam!.minimumWords:"requiredWords" in exam!?exam!.requiredWords:0} palabras.</p>
 <ol>{tasks.map((t,i)=><li key={i}><strong>{t.title} ({t.points} puntos)</strong><p>{t.prompt}</p><p>Al menos {t.minWords} palabras sustantivas, verificables por revisor.</p></li>)}</ol>
 {rubric&&<div><h3>Proyecto integrador con revisión humana</h3><p>{rubric.title}</p><p>{"deliverable" in rubric?rubric.deliverable:""}</p><ul>{rubric.rubric.map(r=><li key={"criterion" in r?r.criterion:r.name}>{"criterion" in r?r.criterion:r.name} · {r.weight} puntos</li>)}</ul></div>}</section>
 <section className="card"><h2>Fuentes y límites</h2><p>Contenido original construido sobre fuentes públicas; no reproduce ni concede el texto completo de normas ISO y no constituye certificación.</p><ul>{course.sources.map((s,i)=>{const url=typeof s==="string"?s:s.url,label=typeof s==="string"?s:s.id;return <li key={i}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>})}</ul>
 <p><strong>Sin disponibilidad para alumnos:</strong> faltan revisión editorial y docente, claves de evaluación protegidas en servidor, traducción beta y validación de accesibilidad.</p></section>
 </main></LocalizedContent>;
}

import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {getServerUser} from "../../../../../lib/supabase-server";
import {requireOwner} from "../../../../../lib/admin";
import {draftExpandedCurriculum,FIFTEEN_LEVEL_TOPICS} from "../../../../../lib/draft-expanded-curriculum";
import LocalizedContent from "../../../../components/localization/server";
export const dynamic="force-dynamic";
export const metadata={title:"Mapa editorial de 15 niveles · Garciloga",robots:{index:false,follow:false}};
type Props={searchParams:Promise<{course?:string;level?:string;unit?:string}>};
export default async function ExpandedDraftEditor({searchParams}:Props){
 const {data:{user}}=await getServerUser();if(!user)redirect("/login");
 try{await requireOwner(user.id);}catch{notFound();}
 const q=await searchParams;
 const pack=draftExpandedCurriculum(q.course??"grc-advanced");if(!pack)notFound();
 const level=pack.levels.find(x=>x.number===Number(q.level))??pack.levels[0];
 const lesson=level.lessons.find(x=>x.key===q.unit)??level.lessons[0];
 const url=(key:string,n:number,u?:string)=>"/admin/curriculum/drafts/expanded?course="+encodeURIComponent(key)+"&level="+n+(u?"&unit="+encodeURIComponent(u):"");
 return <LocalizedContent><main className="wrap academic-draft-inspector">
 <header className="nav"><div><span className="pill">Mapa académico · Borrador</span><h1>Quince niveles para razonar decisiones</h1><p>Editor privado del propietario. Son propuestas pedagógicas no acreditadas, con respuestas sujetas a revisión humana.</p></div><Link className="btn secondary" href="/admin/curriculum/drafts">Volver a los borradores</Link></header>
 <section className="card"><h2>Seleccionar curso</h2><div className="public-actions">{Object.keys(FIFTEEN_LEVEL_TOPICS).map(key=><Link key={key} className={"btn "+(key===pack.key?"":"secondary")} href={url(key,1)}>{key.replaceAll("-"," ")}</Link>)}</div></section>
 <section className="card"><h2>{pack.title}</h2><p>15 niveles de diseño · seis unidades por nivel · competencias observables y revisión humana. No representa 90 lecciones ya validadas.</p><div className="academic-draft-levels">{pack.levels.map(l=><Link key={l.number} href={url(pack.key,l.number)} className={"btn "+(l.number===level.number?"":"secondary")} aria-current={l.number===level.number?"page":undefined}>{l.number}. {l.title}</Link>)}</div>
 <h3>Unidad a revisar</h3><div className="public-actions">{level.lessons.map(l=><Link key={l.key} href={url(pack.key,level.number,l.key)} className={"btn "+(l.key===lesson.key?"":"secondary")}>{l.title}</Link>)}</div></section>
 <section className="card academic-draft-case"><span className="pill">Nivel {level.number} · {level.difficulty}</span><h2>{lesson.title}</h2><p>{lesson.teaching}</p><h3>Objetivo evaluable</h3><p>{lesson.objective}</p><h3>Práctica y entrega</h3><p>{lesson.task}</p><p>Competencias abordadas: {lesson.competencies.join(" · ")}</p></section>
 <section className="card"><h2>Conductas observables</h2><p>La rúbrica evalúa decisiones justificadas dentro de la simulación. No debe inferir personalidad, intención privada ni valor como empleado.</p><ul>{lesson.observableIndicators.map(x=><li key={x}>{x}</li>)}</ul><p>Calificación mínima sugerida: {lesson.assessor.minScore}/100. Se requieren revisión humana independiente y cero errores críticos.</p></section>
 <section className="card"><h2>Tres rondas de decisiones con consecuencias</h2><p>No existe una opción universalmente correcta: cada alternativa tiene beneficios, costos, riesgos y autoridad. El alumno debe defender su selección, revisar supuestos y documentar el historial para la siguiente unidad.</p>{lesson.decision.phases.map((phase,i)=><article className="academic-draft-decision" key={phase.phase}><h3>{i+1}. {phase.phase}</h3><p>{phase.pressure}</p><div className="academic-draft-units">{phase.alternatives.map(option=><div className="card" key={option.id}><h4>{option.id.toUpperCase()}. {option.action}</h4><p><b>Beneficio:</b> {option.benefit}</p><p><b>Costo:</b> {option.cost}</p><p><b>Riesgo:</b> {option.risk}</p><p><b>Autorización:</b> {option.authorization}</p></div>)}</div></article>)}</section>
 <section className="card"><h2>Requisitos de defensa</h2><ul>{lesson.decision.writtenJustificationRequired.map(x=><li key={x}>{x}</li>)}</ul><h3>Historia que debe conservarse para el nivel siguiente</h3><ul>{lesson.decision.transferToNextLevel.map(x=><li key={x}>{x}</li>)}</ul>{level.project&&<p>Proyecto integrador: {level.project.artifact} · revisión humana obligatoria.</p>}</section>
 </main></LocalizedContent>;
}

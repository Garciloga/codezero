import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {getServerUser} from "../../../../../lib/supabase-server";
import {requireOwner} from "../../../../../lib/admin";
import {ownerDraftPractice,DRAFT_PRACTICE_NAMES} from "../../../../../lib/draft-practice-packs";
import LocalizedContent from "../../../../components/localization/server";
export const dynamic="force-dynamic";
export const metadata={title:"Prácticas académicas · Solo propietario",robots:{index:false,follow:false}};
type Props={searchParams:Promise<{course?:string;level?:string;unit?:string}>};
export default async function EditorialPracticePreview({searchParams}:Props){
 const {data:{user}}=await getServerUser();if(!user)redirect("/login");
 try{await requireOwner(user.id);}catch{notFound();}
 const query=await searchParams;
 const pack=ownerDraftPractice(query.course);if(!pack)notFound();
 const level=pack.levels.find(x=>x.number===Number(query.level))??pack.levels[0];
 const unit=level.units.find(x=>x.id===query.unit)??level.units[0];
 const href=(c:string,n:number,u?:string)=>"/admin/curriculum/drafts/practices?course="+encodeURIComponent(c)+"&level="+n+(u?"&unit="+encodeURIComponent(u):"");
 const rubric=unit.instructor.rubric??unit.instructor.rubricDimensions??[];
 return <LocalizedContent><main className="wrap academic-draft-inspector">
 <div className="nav"><div><span className="pill">Borrador privado · Solo propietario</span><h1>Prácticas de aprendizaje y evaluación</h1><p>Solo revisión editorial. Las claves y rúbricas privadas no forman parte del catálogo de alumnos.</p></div><Link className="btn secondary" href={"/admin/curriculum/drafts?course="+encodeURIComponent(pack.key)+"&level="+level.number}>Ver temario</Link></div>
 <section className="card"><h2>Cursos en borrador</h2><div className="public-actions">{DRAFT_PRACTICE_NAMES.map(c=><Link className={"btn "+(c.id===pack.key?"":"secondary")} key={c.id} href={href(c.id,1)}>{c.title}</Link>)}</div></section>
 <section className="card"><h2>{pack.title}</h2><p>{pack.levels.length} niveles · {pack.unitsCount} unidades · {pack.practicesCount} prácticas</p><div className="academic-draft-levels" aria-label="Seleccionar nivel">{pack.levels.map(l=><Link className={"btn "+(l.number===level.number?"":"secondary")} href={href(pack.key,l.number)} key={l.number} aria-current={l.number===level.number?"page":undefined}>{l.number}. {l.title}</Link>)}</div><h3>Seleccionar unidad</h3><div className="public-actions">{level.units.map(u=><Link className={"btn "+(u.id===unit.id?"":"secondary")} key={u.id} href={href(pack.key,level.number,u.id)}>{u.title}</Link>)}</div></section>
 <article className="card"><span className="pill">Nivel {level.number} · {level.difficulty}</span><h2>{unit.title}</h2><p>{unit.objective}</p><h3>Principio aplicado</h3><p>{unit.reading.principle}</p><h3>Caso desarrollado</h3><p>{unit.reading.workedCase}</p><h3>Cálculo y límites de interpretación</h3><p>{unit.reading.quantitativeReasoning}</p><h3>Método de resolución</h3><p>{unit.reading.procedure}</p><h3>Errores a evitar</h3><p>{unit.reading.misconception}</p></article>
 <section className="card"><h2>Ejercicios obligatorios</h2><p>La entrega por sí sola no da aprobación: requiere evaluación humana y cero errores críticos.</p>{unit.practices.map((p,i)=><article className="academic-draft-decision" key={p.id}><span className="pill">Práctica {i+1} · {p.type}</span><h3>{p.title}</h3><p>{p.demand??p.task}</p><p>Extensión mínima: {p.minWords} palabras, con revisión humana.</p><ul>{p.required.map(x=><li key={x}>{x}</li>)}</ul></article>)}</section>
 <section className="card"><h2>Criterios de corrección privados</h2><p>Únicamente para revisión del propietario y editor académico. Nunca enviar este material al navegador de un alumno.</p><p>Resultado de referencia: {unit.instructor.referenceResult??unit.instructor.expectedValue} {unit.instructor.referenceUnit??unit.instructor.unit}</p><p>{unit.instructor.commonFailure}</p><h3>Rúbrica de evaluación</h3><ul>{rubric.map(r=><li key={r.name}>{r.name}: {r.weight} puntos</li>)}</ul><h3>Errores críticos</h3><ul>{unit.instructor.criticalErrors.map(err=><li key={err}>{err}</li>)}</ul></section>
 </main></LocalizedContent>;
}

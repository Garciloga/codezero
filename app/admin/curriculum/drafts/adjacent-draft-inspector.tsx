import Link from "next/link";
import {DRAFT_CURRICULA,ADJACENT_DRAFTS,type AdjacentDraft} from "../../../../lib/draft-curricula";
type Props={draft:AdjacentDraft;selected:number};
export default function AdjacentDraftInspector({draft,selected}:Props){
 const stage=draft.stages.find(x=>x.number===selected)??draft.stages[0];
 const href=(key:string,n:number)=>"/admin/curriculum/drafts?course="+encodeURIComponent(key)+"&level="+n;
 return <main className="wrap academic-draft-inspector">
 <div className="nav"><div><span className="pill">Borrador privado · Solo propietario</span><h1>Laboratorio editorial de cursos</h1><p>Contenido no publicado. Los nombres y respuestas de las decisiones son visibles aquí solamente para revisión; no forman parte de una API pública.</p></div><Link className="btn secondary" href="/admin/curriculum">Volver al inspector</Link></div>
 <section className="card"><h2>Cursos en borrador</h2><div className="public-actions">{Object.values(DRAFT_CURRICULA).map(c=><Link className="btn secondary" key={c.key} href={href(c.key,1)}>{c.title}</Link>)}{Object.values(ADJACENT_DRAFTS).map(c=><Link className={"btn "+(c.key===draft.key?"":"secondary")} key={c.key} href={href(c.key,1)}>{c.title}</Link>)}</div>
 <p className="muted">Idioma base: español. EN/PT/FR pendientes de traducción y verificación nativa. No permite acreditar competencias, emitir diplomas ni activar el checkout.</p></section>
 <section className="card"><h2>{draft.title}</h2><p>{draft.audience}</p><p>{draft.kind==="curriculum"?"Curso en preparación":"Flujo funcional y académico en preparación"}</p>
 <div className="academic-draft-levels" aria-label="Seleccionar nivel">{draft.stages.map(s=><Link key={s.id} href={href(draft.key,s.number)} aria-current={s.number===stage.number?"page":undefined} className={"btn "+(s.number===stage.number?"":"secondary")}>{s.number}. {s.title}</Link>)}</div></section>
 <article className="card academic-draft-case"><span className="pill">Nivel {stage.number} · {stage.difficulty}</span><h2>{stage.title}</h2><h3>Hechos del caso</h3><p>{stage.case.facts}</p><h3>Conflicto que debe resolverse</h3><p>{stage.case.conflict}</p><h3>Indicador de resultado</h3><p>{stage.case.metric}</p></article>
 <section aria-label="Unidades de estudio"><h2>Aprendizaje y entregables</h2><div className="academic-draft-units">{stage.units.map(u=><article className="card" key={u.id}><h3>{u.title}</h3><p>{u.teaching}</p><h4>Ejercicio que exige evidencia</h4><p>{u.deliverable}</p><p>Extensión mínima: {u.evidence.minWords} palabras, con revisión humana.</p><ul>{u.evidence.fields.map(f=><li key={f}>{f}</li>)}</ul></article>)}</div></section>
 <section className="card"><h2>Decisiones y consecuencias del caso</h2><p>Estas claves son solo para el revisor; nunca deben salir en el contenido público de ejercicios ni en un endpoint de evaluación.</p>
 {stage.decisions.map((q,i)=><div className="academic-draft-decision" key={i}><h3>Decisión {i+1}</h3><p>{q.prompt}</p><ol type="A">{q.options.map((option,j)=><li key={j}>{option}{q.correctIndex===j&&<b> · criterio preferente</b>}</li>)}</ol><p>{q.feedback}</p></div>)}</section>
 <section className="card"><h2>Evaluación aplicada de nivel · revisión obligatoria</h2><p>Calificación mínima: 80/100. Cada respuesta debe explicar razonamiento, impacto, datos y alternativa descartada; escribir «terminé» no se considera evidencia.</p><p>Extensión total de referencia: {stage.assessment.minimumWords} palabras.</p>
 <ol>{stage.assessment.tasks.map((t,i)=><li key={i}><strong>{t.title} ({t.points} puntos)</strong><p>{t.prompt}</p><p>Al menos {t.minWords} palabras sustantivas, verificables por revisor.</p></li>)}</ol>
 {stage.project&&<div><h3>Proyecto integrador con revisión humana</h3><p>{stage.project.title}: {stage.project.deliverable}</p><ul>{stage.project.rubric.map(r=><li key={r.name}>{r.name} · {r.weight} puntos</li>)}</ul></div>}</section>
 <section className="card"><h2>Fuentes y límites</h2><p>Reglas de seguridad y revisión humana</p><ul>{draft.guardrails.map(r=><li key={r}>{r}</li>)}</ul><p><strong>Sin disponibilidad para alumnos:</strong> faltan revisión editorial y docente, claves de evaluación protegidas en servidor, traducción beta y validación de accesibilidad.</p></section>
 </main>;
}

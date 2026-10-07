"use client";
import { useState } from "react";
import type { LabAnswer, LabRequest, LabResponse } from "../../../lib/career-lab";
import type { CareerPositionKey } from "../../../lib/career-guidance";
import { startLearningPath, transitionLearningPath } from "../../../lib/career-learning-path";
import type { LearningAction, LearningPath } from "../../../lib/career-learning-path";
import LearningPathView from "./learning-path";
const band={preliminary:"Preliminar",medium:"Media",strong:"Alta"};
const gate={ready_now:"Evidencia de experiencia suficiente en este escenario",near_ready:"Requiere ampliar evidencia",future_progression:"Progresión futura",insufficient_evidence:"Sin evidencia de experiencia"};
export default function CareerLab({fixtures,version}:{fixtures:{key:string;label:string}[];version:string}){
 const [enabled,setEnabled]=useState(false),[mode,setMode]=useState<LabRequest["mode"]>("guided");
 const [fixture,setFixture]=useState("developer"),[experience,setExperience]=useState<LabRequest["experience"]>("unknown");
 const [data,setData]=useState<LabResponse|null>(null),[answers,setAnswers]=useState<LabAnswer[]>([]);
 const [option,setOption]=useState<number|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [selectedPath,setSelectedPath]=useState<CareerPositionKey|null>(null);
 const [paths,setPaths]=useState<Partial<Record<CareerPositionKey,LearningPath>>>({});
 const [feedback,setFeedback]=useState<Record<string,string>>({});
 async function run(nextAnswers:LabAnswer[]){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/internal/career-lab",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({version,synthetic:true,enabled:true,mode,answers:nextAnswers,experience,...(mode==="fixture"?{fixture}:{})}),cache:"no-store"});
   const result=await response.json();
   if(!response.ok) throw Error(result.error==="NOT_FOUND"?"Tu sesión no tiene acceso a este laboratorio.":result.error==="CAREER_MODEL_CHANGED"?"El modelo cambió. Recarga el laboratorio.":"No se pudo calcular el escenario. Intenta otra vez.");
   setData(result);setAnswers(nextAnswers);setOption(null);
  }catch(e){setError(e instanceof Error?e.message:"No se pudo completar la prueba.");}finally{setBusy(false);}
 }
 function reset(){setData(null);setAnswers([]);setOption(null);setError("");setSelectedPath(null);setPaths({});setFeedback({});}
 const path=selectedPath?paths[selectedPath]??null:null;
 function selectPath(position:CareerPositionKey|null){
  setSelectedPath(position);
  if(position)setPaths(previous=>({...previous,[position]:previous[position]??startLearningPath(position)}));
 }
 function decideLearning(action:LearningAction){
  if(!selectedPath)return;
  setPaths(previous=>{
   const current=previous[selectedPath];
   return current?{...previous,[selectedPath]:transitionLearningPath(current,action)}:previous;
  });
 }
 return <main className="wrap career-lab">
 <div className="nav"><div><span className="pill">FASE 0 · SOLO PROPIETARIO</span><h1>Laboratorio Career Guidance</h1></div><a className="btn secondary" href="/admin">Panel de control</a></div>
 <div className="card"><h2>Prueba un personaje ficticio</h2><p>Diagnóstico, explicaciones y aprendizaje por decisiones. Las selecciones representan a un personaje de prueba. No ingreses información personal.</p>
 <p className="muted">Las respuestas y el recorrido se mantienen solo durante esta sesión de pantalla. Recargar o reiniciar los elimina. Las rúbricas son provisionales y no están validadas con resultados laborales.</p>
 <label className="lab-check"><input type="checkbox" checked={enabled} disabled={busy} onChange={e=>{setEnabled(e.target.checked);reset();}}/> Habilitar la simulación temporal con datos sintéticos</label>
 {!data&&<div className="lab-controls">
 <label>Modo<select value={mode} disabled={busy} onChange={e=>setMode(e.target.value as LabRequest["mode"])}><option value="guided">Recorrido guiado: 8 actividades y hasta 3 comparaciones</option><option value="fixture">Escenario sintético precargado</option></select></label>
 {mode==="fixture"&&<label>Escenario<select value={fixture} disabled={busy} onChange={e=>setFixture(e.target.value)}>{fixtures.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label>}
 <label>Experiencia ficticia<select value={experience} disabled={busy} onChange={e=>setExperience(e.target.value as LabRequest["experience"])}><option value="unknown">No aportada</option><option value="limited">Limitada</option><option value="established">Experiencia amplia de prueba</option></select></label>
 <button className="btn" disabled={!enabled||busy} onClick={()=>run([])}>{busy?"Calculando…":"Iniciar simulación"}</button></div>}
 {data&&<button className="btn secondary" disabled={busy} onClick={reset}>Reiniciar y borrar la sesión de prueba</button>}
 </div>
 {error&&<p role="alert" className="card">{error}</p>}
 <div aria-live="polite" aria-busy={busy}>
 {data?.activity&&<section className="card lab-section"><p className="muted">Base: {data.completedBase} de 8 · Comparaciones: {data.completedExtra} de máximo 3</p><progress value={data.completedBase} max={8} aria-label="Actividades base completadas"/>
 <h2>{data.activity.title}</h2><p>{data.activity.scenario}</p>
 <fieldset disabled={busy}><legend>Decisión del personaje</legend>{data.activity.options.map((text,i)=><label className="lab-option" key={text}><input type="radio" name="decision" checked={option===i} onChange={()=>setOption(i)}/>{text}</label>)}</fieldset>
 <button className="btn" disabled={option===null||busy} onClick={()=>run([...answers,{key:data.activity!.key,option:option!}])}>{busy?"Calculando…":"Confirmar decisión"}</button>
 </section>}
 {data&&data.lessons.length>0&&<section className="card lab-section"><h2>Aprendizaje después de decidir</h2><p>{data.lessons[data.lessons.length-1].lesson}</p><details><summary>Repasar decisiones anteriores</summary><ol>{data.lessons.map(l=><li key={l.key}>{l.lesson}</li>)}</ol></details></section>}
 {data?.result&&<>
 <section className="lab-section"><h2>Rutas para explorar</h2><p>Confianza {band[data.result.confidenceBand].toLowerCase()} · {data.evidenceCount} señales ficticias. Afinidad no equivale a probabilidad de conseguir empleo.</p>
 {!data.result.recommendations.length?<p className="card">No hay evidencia para recomendar una ruta. Puedes explorar cualquier módulo.</p>:<div className="grid grid2">{data.result.recommendations.map(r=><article className="card" key={r.position}><h3>{r.label}</h3><p><b>{r.affinityPercent}% de afinidad sintética</b>{r.practicallyTied?" · Ruta compatible por empate práctico":""}</p><p>{gate[r.experienceGate]}</p><details><summary>¿Por qué aparece?</summary><ul>{r.reasons.map(reason=><li key={reason.dimension}>{reason.label}: {Math.round(reason.score*100)}/100</li>)}</ul></details><label>Feedback de prueba<select value={feedback[r.position]??""} onChange={e=>setFeedback({...feedback,[r.position]:e.target.value})}><option value="">Elige una respuesta</option><option>Representa al personaje</option><option>No lo representa</option><option>No estoy seguro</option><option>Explorar de todos modos</option></select></label><p className="muted">El feedback queda temporalmente en pantalla y no modifica evidencia.</p><button className="btn secondary" onClick={()=>selectPath(r.position)}>Explorar módulo</button></article>)}</div>}
 <p className="muted">{data.result.disclaimer}</p></section>
 <section className="card lab-section"><h2>Construye tu camino de aprendizaje</h2><p>Elige por interés, aunque la ruta no esté entre las recomendaciones. Cada decisión cambia la misión siguiente.</p>
 <label>Posición a explorar<select value={selectedPath??""} onChange={e=>selectPath(e.target.value?e.target.value as CareerPositionKey:null)}><option value="">Selecciona un módulo</option>{data.catalog.map(r=><option key={r.position} value={r.position}>{r.label}{r.progression?" · progresión":""}</option>)}</select></label>
 {path&&<LearningPathView key={path.position+":"+path.goal} path={path} onDecision={decideLearning}/> }</section>
 <section className="card lab-section"><h2>Las 16 posiciones</h2><div className="lab-table"><table><caption>Afinidad y cobertura de evidencia del escenario</caption><thead><tr><th>Posición</th><th>Afinidad</th><th>Dimensiones observadas</th><th>Experiencia</th></tr></thead><tbody>{data.catalog.map(r=><tr key={r.position}><td>{r.label}{r.progression?" · Progresión futura":""}</td><td>{r.coverage?r.affinityPercent+"%":"Sin evidencia"}</td><td>{r.coverage}</td><td>{gate[r.experienceGate]}</td></tr>)}</tbody></table></div></section>
 <details className="card lab-section"><summary>Cómo funciona esta prueba</summary><p>Modelo {version}. Las actividades usan selecciones cerradas y una rúbrica provisional de desempeño. Las comparaciones extra y la elección libre aportan preferencia. Las variables no observadas permanecen ausentes; no se rellenan con ceros.</p><p>Los perfiles canónicos y de frontera se construyen desde la matriz del propio modelo: sirven para comprobar coherencia matemática, no para validar utilidad real. Management se muestra como progresión, fuera del top 3 inicial.</p><ul>{data.dimensions.map(d=><li key={d.dimension}>{d.dimension}: {Math.round(d.score*100)}/100 · {d.maturity==="stable"?"evidencia repetida":"preliminar"}{d.tension.status==="mixed"?" · diferencia entre capacidad y preferencia":""}</li>)}</ul></details>
 </>}
 </div></main>;
}


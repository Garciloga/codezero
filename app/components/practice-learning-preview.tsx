"use client";
import LocalizedContent from "./localization/client";


import { useState } from "react";
import { API_LABS, ONBOARDING_TASKS, PRACTICE_ACTIVITIES, SKILL_LABELS, TARGET_ROLES, gradePractice, simulateApi, skillPracticeCoverage, weeklyPracticePlan } from "../../lib/practice-learning";
import type { ApiLab, PracticeActivity } from "../../lib/practice-learning";

import { EMPTY_PRACTICE_PROGRESS } from "../../lib/practice-progress";
import type { PracticeProgress } from "../../lib/practice-progress";
import { nextPracticeChoices, type PracticeApproach } from '../../lib/role-practice-cases';

function Activity({ activity, onSuccess }: { activity: PracticeActivity; onSuccess: (id: string) => void }) {
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState(activity.options?.map((_, i) => String(i)) ?? []);
  const [result, setResult] = useState<boolean | null>(null);
  function move(index: number, direction: number) {
    const next = [...order]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setOrder(next); setResult(null);
  }
  return <LocalizedContent><article className="card" id={`sample-${activity.id}`}>
    <p className="muted">Nivel {activity.level} · {SKILL_LABELS[activity.skill]}</p>
    <h3>{activity.title}</h3><pre style={{ whiteSpace: "pre-wrap" }}>{activity.prompt}</pre>
    <form onSubmit={event => { event.preventDefault(); const correct = gradePractice(activity, activity.kind === "order_steps" ? order : answer); setResult(correct); if (correct) onSuccess(activity.id); }}>
      {activity.kind === "order_steps" ? <ol>{order.map((id, index) => <li key={id} style={{ marginBottom: 12 }}>
        <span>{activity.options?.[Number(id)]}</span>{" "}
        <button className="btn secondary" type="button" disabled={index === 0} aria-label={`Subir: ${activity.options?.[Number(id)]}`} onClick={() => move(index, -1)}>↑</button>{" "}
        <button className="btn secondary" type="button" disabled={index === order.length - 1} aria-label={`Bajar: ${activity.options?.[Number(id)]}`} onClick={() => move(index, 1)}>↓</button>
      </li>)}</ol> : activity.kind === "find_error" ? <fieldset><legend>Elige la explicación</legend>{activity.options?.map((option, index) => <label key={option} style={{ display: "block", margin: "12px 0" }}><input type="radio" name={activity.id} required checked={answer === String(index)} onChange={() => { setAnswer(String(index)); setResult(null); }} /> {option}</label>)}</fieldset>
        : <label style={{ display: "block", marginBottom: 16 }}>Tu respuesta <input value={answer} maxLength={200} required onChange={event => { setAnswer(event.target.value); setResult(null); }} /></label>}
      <button className="btn" type="submit">Comprobar práctica</button>
    </form>
    {result !== null && <div role="status"><p><b>{result ? "Práctica resuelta." : "Revisa y vuelve a intentarlo."}</b> {activity.explanation}</p><p><b>Entrega sugerida:</b> {activity.evidence}</p></div>}
  </article></LocalizedContent>;
}

function ApiActivity({ lab, onSuccess }: { lab: ApiLab; onSuccess: (id: string) => void }) {
  const [method, setMethod] = useState("GET"); const [path, setPath] = useState(lab.path);
  const [token, setToken] = useState(""); const [body, setBody] = useState("{}");
  const [resolution, setResolution] = useState("");
  const [response, setResponse] = useState<ReturnType<typeof simulateApi> | null>(null);
  return <LocalizedContent><article className="card" id={`sample-${lab.id}`}><p className="muted">Nivel {lab.level} · APIs e integraciones</p><h3>{lab.title}</h3><p>{lab.task}</p>
    <p>Contrato: <code>{lab.method} {lab.path}</code>. Token de prueba: <code>demo_reader</code>. Sin datos reales.</p>
    <form onSubmit={event => { event.preventDefault(); const result = simulateApi(lab, { method, path, token, body, resolution }); setResponse(result); if (result.diagnosed) onSuccess(lab.id); }} onChange={() => setResponse(null)}>
      <label style={{ display: "block", marginBottom: 12 }}>Método <select value={method} onChange={event => setMethod(event.target.value)}>{["GET", "POST", "PUT", "DELETE"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label style={{ display: "block", marginBottom: 12 }}>Endpoint ficticio <input value={path} maxLength={150} onChange={event => setPath(event.target.value)} required /></label>
      <label style={{ display: "block", marginBottom: 12 }}>Token ficticio <input value={token} maxLength={40} onChange={event => setToken(event.target.value)} required autoComplete="off" /></label>
      <label style={{ display: "block", marginBottom: 12 }}>Cuerpo JSON <textarea value={body} maxLength={4000} rows={3} onChange={event => setBody(event.target.value)} required /></label>
      <fieldset><legend>Hipótesis de corrección</legend>{lab.choices.map((choice, i) => <label style={{ display: "block", margin: "12px 0" }} key={choice}><input type="radio" name={lab.id} value={i} checked={resolution === String(i)} onChange={() => setResolution(String(i))} /> {choice}</label>)}</fieldset>
      <button className="btn" type="submit">Simular solicitud y diagnóstico</button>
    </form>
    {response && <div role="status"><p><b>Respuesta del simulador: {response.status}</b></p><pre style={{ whiteSpace: "pre-wrap" }}>{response.output}</pre>
      {response.status === 200 && <><p><b>{response.diagnosed ? "Diagnóstico correcto." : "Revisa tu hipótesis de corrección."}</b> {lab.explanation}</p><p>Este reporte no ejecuta la reparación. Entrega sugerida: {lab.evidence}</p></>}
    </div>}
  </article></LocalizedContent>;
}

export default function PracticeLearningPreview({ initialLevel, persistence = false, saved = null }: { initialLevel: number | null; persistence?: boolean; saved?: { progress: PracticeProgress; revision: number } | null }) {
  const initial = saved?.progress ?? EMPTY_PRACTICE_PROGRESS;
  const [revision, setRevision] = useState(saved?.revision ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initial));
  const [level, setLevel] = useState<number | null>(initialLevel); const [role, setRole] = useState(initial.role);
  const [passed, setPassed] = useState<string[]>(initial.passed); const [startDay, setStartDay] = useState(initial.startDay);
  const [onboarding, setOnboarding] = useState<number[]>(initial.onboarding); const [pulse, setPulse] = useState(initial.pulse);
  const [pulseSaved, setPulseSaved] = useState(false);
  const [approach,setApproach] = useState<PracticeApproach>('process');
  const suggestions = nextPracticeChoices(role,passed,approach);
  const progress: PracticeProgress = { version: initial.version, role, passed, startDay, onboarding, pulse };
  const snapshot = JSON.stringify(progress);
  async function save() {
    if (saving) return;
    setSaving(true); setSaveMessage("");
    try {
      const response = await fetch("/api/practice-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress, revision }) });
      const result = await response.json();
      if (!response.ok || !Number.isSafeInteger(result.revision)) throw new Error(result.error || "No se pudo guardar");
      setRevision(result.revision); setSavedSnapshot(snapshot); setSaveMessage("Progreso privado guardado en tu cuenta de pruebas.");
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : "No se pudo guardar. Conserva la página abierta."); }
    finally { setSaving(false); }
  }
  const activities = PRACTICE_ACTIVITIES.filter(item => level === null || item.level === level);
  const labs = API_LABS.filter(item => level === null || item.level === level);
  const coverage = skillPracticeCoverage(passed, role); const plan = weeklyPracticePlan(passed, role, startDay);
  function record(id: string) { setPassed(current => current.includes(id) ? current : [...current, id]); }
  return <LocalizedContent><>
    <section className="card"><h2>Elige tu objetivo y tu práctica</h2>
      <label>Puesto objetivo <select value={role} onChange={event => setRole(event.target.value)}>{TARGET_ROLES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{" "}
      <label>Nivel <select value={level ?? "all"} onChange={event => setLevel(event.target.value === "all" ? null : Number(event.target.value))}><option value="all">Todas las muestras</option>{Array.from({ length: 15 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
      <p>Estas muestras son opcionales. No desbloquean niveles, consumen cuotas ni emiten diplomas. Se registra únicamente la exploración de muestras; no acredita competencias profesionales.</p>
      {persistence ? <><p>Guarda tu objetivo, muestras marcadas como resueltas, semana, checklist y pulso privado. Las respuestas, el código y la salida del editor no se guardan. {snapshot !== savedSnapshot ? "Hay cambios sin guardar." : "Sin cambios pendientes."}</p><button type="button" className="btn secondary" disabled={saving || snapshot === savedSnapshot} onClick={save}>{saving ? "Guardando…" : "Guardar mi progreso"}</button><p role="status">{saveMessage}</p></> : <p>Modo de exploración: se pierde el progreso al recargar. El guardado requiere una cuenta activa y una base de pruebas configurada.</p>}
    </section>
    <section className="card" style={{marginTop:24}}><h2>Decide tu siguiente paso</h2><label>¿Qué quieres practicar ahora? <select value={approach} onChange={event=>setApproach(event.target.value as PracticeApproach)}><option value="process">Entender un proceso</option><option value="code">Trabajar con código y datos</option><option value="customer">Explicar al cliente</option></select></label><p>Tu elección orienta estas muestras; puedes cambiar de enfoque o puesto en cualquier momento. El enfoque solo dura esta sesión.</p>
      {suggestions.length ? <ul>{suggestions.map(item=><li key={item.id}><a href={`#sample-${item.id}`} onClick={()=>setLevel(null)}>{item.title}</a><p className="muted">{item.reason}</p></li>)}</ul> : <p>Ya exploraste las muestras de este objetivo. Revisa tu evidencia con la rúbrica o elige otro puesto; esto no acredita dominio.</p>}
    </section>
    <section style={{ marginTop: 24 }}><h2>Práctica de lógica, código y comunicación</h2>
      <div className="grid grid2">{activities.map(activity => <Activity key={activity.id} activity={activity} onSuccess={record} />)}</div>
      {!activities.length && <p>No hay muestra de este formato para el nivel seleccionado.</p>}
    </section>
    <section style={{ marginTop: 24 }}><h2>Laboratorio de APIs · niveles 11–15</h2><p>Arma una petición y analiza el fallo. Todo se simula en tu navegador: no se llama a endpoints externos ni se envían tokens.</p>
      <div className="grid grid2">{labs.map(lab => <ApiActivity key={lab.id} lab={lab} onSuccess={record} />)}</div>
      {!labs.length && <p>Elige un nivel entre 11 y 15 para explorar un caso de integración.</p>}
    </section>
    <section className="card" style={{ marginTop: 24 }}><h2>Brechas de práctica para tu objetivo</h2><p>Es una orientación sobre estas muestras, no una evaluación de dominio profesional ni el resultado de tu diagnóstico de afinidad.</p>
      <ul>{coverage.map(item => <li key={item.skill}>{SKILL_LABELS[item.skill]}: {item.practiced} de {item.total} muestras resueltas. {item.practiced === 0 ? "Sin muestras resueltas." : "Todavía requiere evidencia revisada."}</li>)}</ul>
      <label>Inicio de tu semana <input type="date" value={startDay} onChange={event => setStartDay(event.target.value)} /></label>
      {plan.length > 0 && <div style={{overflowX:"auto"}}><table><caption>Tu siguiente plan de acción</caption><thead><tr><th scope="col">Meta</th><th scope="col">Responsable</th><th scope="col">Fecha</th><th scope="col">Evidencia</th></tr></thead><tbody>{plan.map(item => <tr key={item.skill}><td>{item.task}</td><td>{item.owner}</td><td>{item.day}</td><td>{item.evidence}</td></tr>)}</tbody></table></div>}
      {startDay && !plan.length && <p>Revisa la fecha o elige otro objetivo. Completar las muestras no acredita dominio del puesto.</p>}
    </section>
    <section className="card" style={{ marginTop: 24 }}><h2>Tu primera semana</h2><p>Checklist de exploración; marcar una tarea no modifica tu avance oficial.</p>
      {ONBOARDING_TASKS.map((task, i) => <label key={task} style={{ display: "block", margin: "12px 0" }}><input type="checkbox" checked={onboarding.includes(i)} onChange={event => setOnboarding(current => event.target.checked ? [...current, i] : current.filter(day => day !== i))} /> Día {i + 1}: {task}</label>)}
    </section>
    <section className="card" style={{ marginTop: 24 }}><h2>Pulso al cerrar tu práctica</h2><form onSubmit={event => { event.preventDefault(); setPulseSaved(true); }}>
      <label>¿Qué te ayudó más o dónde te atoraste? <textarea maxLength={500} required value={pulse} onChange={event => { setPulse(event.target.value); setPulseSaved(false); }} /></label>
      <button className="btn secondary" type="submit">Comprobar respuesta en esta sesión</button>
      {pulseSaved && <p role="status">Respuesta preparada. Usa «Guardar mi progreso» si el guardado de pruebas está disponible. No se publica como testimonio.</p>}
    </form></section>
  </></LocalizedContent>;
}


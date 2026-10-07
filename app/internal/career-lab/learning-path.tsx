"use client";

import { useState } from "react";
import { LEARNING_GUIDES } from "../../../lib/career-learning-content";
import { GOAL_LABELS, LEARNING_GOALS } from "../../../lib/career-learning-path";
import type { LearningAction, LearningPath } from "../../../lib/career-learning-path";
import { ROLE_PRACTICES } from "../../../lib/career-lab-catalog";
import DecisionPilot from "./decision-pilot";
import { ROLE_WORKFLOWS, ROLE_DELIVERY_TEMPLATES } from "../../../lib/career-role-workflows";
import CustomerSuccessCase from "./customer-success-case";

export default function LearningPathView({
  path, onDecision,
}: {
  path: LearningPath;
  onDecision: (action: LearningAction) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const guide = LEARNING_GUIDES[path.position];
  const practice = ROLE_PRACTICES[path.position];
  const workflow = ROLE_WORKFLOWS[path.position];
  const reviewLabels = [
    "Preparé la entrega con datos inventados.",
    "Revisé cada criterio y puedo explicar mis decisiones.",
    "Identifiqué una limitación o algo que necesito practicar.",
  ];

  return <div className="lab-section">
    <label>¿Qué quiere aprender el personaje?
      <select value={path.goal} onChange={e => onDecision({ type: "choose", goal: e.target.value as LearningPath["goal"] })}>
        {LEARNING_GOALS.map(goal => <option value={goal} key={goal}>{GOAL_LABELS[goal]}</option>)}
      </select>
    </label>
    <p><b>{path.reviewed.length} de 3 misiones introductorias revisadas</b> · sesión temporal</p>
    <progress max={3} value={path.reviewed.length} aria-label="Misiones introductorias revisadas" />
    <p className="muted">La revisión registra una comprobación de comprensión o una autoevaluación. No certifica dominio profesional.</p>

    {path.goal === "foundation" ? <>
      <h3>Primero: comprender el criterio</h3>
      <p>{guide.concept}</p>
      <p><b>Ejemplo:</b> {practice.example}</p>
      <fieldset>
        <legend><b>Comprueba tu comprensión:</b> {guide.question}</legend>
        {guide.options.map((option, index) => <label className="lab-option" key={option.text}>
          <input type="radio" name={"learning-" + path.position} checked={selected === index}
            onChange={() => setSelected(index)} />{option.text}
        </label>)}
      </fieldset>
      <button className="btn" disabled={selected === null} onClick={() => onDecision({ type: "answer", option: selected! })}>Ver consecuencia de la decisión</button>
      {path.feedback && <div className="lab-section" role="status">
        <b>{path.feedback.correct ? "El criterio está bien aplicado." : "Conviene reforzar este criterio."}</b>
        <p>{path.feedback.explanation}</p>
        <p>{path.feedback.correct ? "Puedes continuar con la práctica o explorar el reto." : "Relee el fundamento y prueba otra decisión; también puedes elegir una práctica con apoyo."}</p>
      </div>}
    </> : <>
      <h3>{path.goal === "guided" ? "Práctica con apoyo" : "Reto de aplicación"}</h3>
      {!path.reviewed.includes("foundation") && <p className="muted">Puedes comenzar aquí. Si necesitas apoyo, el fundamento explica el criterio de esta práctica.</p>}
      <p>{practice.task}</p>
      {path.goal === "guided" ? <>
        <h4>Pasos de trabajo</h4>
        <ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <details><summary>Consultar un ejemplo</summary><p>{practice.example}</p></details>
      </> : <p><b>Nueva condición del caso:</b> {guide.twist}</p>}
      <p><b>Entrega sugerida:</b> {practice.deliverable}</p>
      <p><b>Criterio de revisión:</b> {practice.review}</p>
      <p className="muted">Reserva 20–30 minutos. Prepara tu respuesta fuera de esta pantalla con datos ficticios; el laboratorio no recibe entregas.</p>
      <fieldset>
        <legend>Autoevaluación de la misión</legend>
        {reviewLabels.map((label, index) => <label className="lab-check" key={label}>
          <input type="checkbox" checked={checks[index]} onChange={e => setChecks(previous => previous.map((checked, i) => i === index ? e.target.checked : checked))} />
          {label}
        </label>)}
      </fieldset>
      <button className="btn" disabled={!checks.every(Boolean)} onClick={() => onDecision({ type: "review", checks })}>Marcar autoevaluación revisada</button>
      {path.reviewed.includes(path.goal) && <p role="status">Misión marcada como revisada por autoevaluación. Puedes repetirla, reforzar fundamentos o elegir el siguiente reto.</p>}
    </>}

    <details className="lab-section">
      <summary>Profundiza: cómo trabaja esta posición</summary>
      <p><b>Proceso:</b> {workflow.process}</p>
      <h4>Prácticas para ampliar el caso</h4>
      <ol>{workflow.activities.map(activity => <li key={activity}>{activity}</li>)}</ol>
      <p><b>Entrega:</b> {workflow.deliverable}</p>
      <p><b>Decisión para discutir:</b> {workflow.decision}</p>
      <p><b>Cómo revisar:</b> {workflow.quality}</p>
      <details><summary>Usar una plantilla para organizar la entrega</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{ROLE_DELIVERY_TEMPLATES[path.position].map(field => field + ":").join("\n")}</pre>
        <p>Completa fuera de esta pantalla con datos ficticios, evidencia y límites. Si una información falta, márcala como pendiente y define quién la verifica.</p>
      </details>
      <p className="muted">Propuestas de práctica con datos ficticios. No agregan puntuación, certificación ni misiones completadas.</p>
      <a href={workflow.source} target="_blank" rel="noopener noreferrer">Referencia del proceso (abre otra pestaña)</a>
    </details>
    {path.position === "customer_success" && <CustomerSuccessCase />}
    <h4>Elige el siguiente paso</h4>
    <div className="lab-actions">
      {LEARNING_GOALS.map(goal => <button className="btn secondary" key={goal}
        onClick={() => onDecision({ type: "choose", goal })}>{GOAL_LABELS[goal]}</button>)}
    </div>
    {path.reviewed.length === 3 && <p>Revisaste las tres misiones de este módulo. Puedes profundizar repitiendo el reto o explorar otra posición.</p>}
    {path.pilot && <DecisionPilot state={path.pilot} onDecision={action => onDecision({ type: "pilot", action })} />}
    {path.history.length > 0 && <details className="lab-section">
      <summary>Ver decisiones recientes del camino</summary>
      <ol>{path.history.slice(-10).map((entry, index) => <li key={index}>
        {GOAL_LABELS[entry.goal]} · {entry.reason === "choice" ? "elección propia" : entry.reason === "reinforce" ? "reforzar criterio" : "misión revisada"}
      </li>)}</ol>
    </details>}
  </div>;
}

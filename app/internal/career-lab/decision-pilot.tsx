"use client";
import LocalizedContent from "../../components/localization/client";


import { useEffect, useRef } from "react";
import { DECISION_PILOT, PILOT_CHECK_LABELS } from "../../../lib/career-decision-pilot";
import type { PilotAction, PilotState } from "../../../lib/career-decision-pilot";

export default function DecisionPilot({ state, onDecision }: {
  state: PilotState; onDecision: (action: PilotAction) => void;
}) {
  const node = DECISION_PILOT[state.node];
  const heading = useRef<HTMLHeadingElement>(null);
  const previousNode = useRef(state.node);
  useEffect(() => {
    if (previousNode.current !== state.node) heading.current?.focus();
    previousNode.current = state.node;
  }, [state.node]);

  return <LocalizedContent><section className="lab-section" aria-label="Misión piloto por decisiones">
    <h3>Misión piloto: corrige un formulario</h3>
    <p>Decide, lee la consecuencia y elige por dónde continuar. Caso ficticio, sin ejecutar código ni recibir entregas.</p>
    <p><b>{state.checks.length} de 3 comprobaciones de comprensión revisadas</b> · progreso independiente de las misiones introductorias</p>
    <progress max={3} value={state.checks.length} aria-label="Comprobaciones del piloto revisadas" />
    <h4 ref={heading} tabIndex={-1}>{node.title}</h4>
    <p>{node.scenario}</p>
    {state.node === "complete" ? <>
      <ul>{Object.entries(PILOT_CHECK_LABELS).map(([key, label]) => <li key={key}>
        {label}: {state.checks.includes(key as keyof typeof PILOT_CHECK_LABELS) ? "revisada" : "pendiente"}
      </li>)}</ul>
      <p>Este cierre registra exploración; las comprobaciones pendientes siguen pendientes. No certifica competencia profesional.</p>
    </> : <PilotDecision key={state.node} node={node} feedback={state.feedback} onDecision={onDecision} />}
    <div className="lab-actions lab-section">
      <button type="button" className="btn secondary" disabled={!state.back.length}
        onClick={() => onDecision({ type: "back" })}>Volver al paso anterior</button>
      <button type="button" className="btn secondary" onClick={() => onDecision({ type: "restart" })}>Reiniciar solo el piloto</button>
    </div>
    <p className="muted">Al cambiar de misión o posición conservas este piloto durante la sesión. Recargar o reiniciar todo el laboratorio elimina sus decisiones.</p>
    {state.history.length > 0 && <details className="lab-section">
      <summary>Repasar decisiones del piloto</summary>
      <ol>{state.history.slice(-10).map((entry, index) => <li key={index}>
        <b>{DECISION_PILOT[entry.node].title}:</b> {entry.choice}<p>{entry.consequence}</p>
      </li>)}</ol>
    </details>}
  </section></LocalizedContent>;
}

function PilotDecision({ node, feedback, onDecision }: {
  node: (typeof DECISION_PILOT)[keyof typeof DECISION_PILOT];
  feedback: PilotState["feedback"];
  onDecision: (action: PilotAction) => void;
}) {
  return <LocalizedContent><>
    <fieldset disabled={feedback !== null}>
      <legend>{node.question}</legend>
      <p className="muted">Elige una opción para ver su consecuencia antes de avanzar.</p>
      <div className="lab-actions">{node.choices.map(choice => <button type="button" className="btn secondary" key={choice.key}
        onClick={() => onDecision({ type: "answer", choice: choice.key })}>{choice.text}</button>)}</div>
    </fieldset>
    {feedback && <div className="lab-section">
      <div role="status"><b>Consecuencia en el caso ficticio</b><p>{feedback.consequence}</p></div>
      <p><b>Próximo paso:</b> {DECISION_PILOT[feedback.next].title}</p>
      <button type="button" className="btn" onClick={() => onDecision({ type: "continue" })}>Continuar por este camino</button>
    </div>}
  </></LocalizedContent>;
}


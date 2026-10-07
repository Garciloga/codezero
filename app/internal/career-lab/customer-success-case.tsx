"use client";
import LocalizedContent from "../../components/localization/client";

import { useState } from "react";
import { CS_CASE_METRICS, CS_CASE_STAGES, getCsDecisionFeedback } from "../../../lib/customer-success-practical-case";

export default function CustomerSuccessCase() {
  const [stageIndex, setStageIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const stage = CS_CASE_STAGES[stageIndex];
  const feedback = getCsDecisionFeedback(stage.key, decisions[stage.key] ?? "");
  return <LocalizedContent><details className="lab-section">
    <summary>Practica Customer Success: una cuenta de principio a fin</summary>
    <p>Cuenta Faro es ficticia. Tiene 30 usuarios habilitados y busca reducir la preparación de un reporte de cinco a dos días laborables. Puedes explorar las etapas en cualquier orden.</p>
    <p className="muted">Solo práctica local: tus borradores no se envían ni se guardan. Recargar o cambiar de posición los elimina. Usa únicamente datos inventados; no otorga puntos ni certificados.</p>
    <details><summary>Consultar los datos ficticios del caso</summary>
      <div style={{ overflowX: "auto" }}><table>
        <caption>Observaciones semanales; no demuestran causalidad</caption>
        <thead><tr><th scope="col">Semana</th><th scope="col">Usuarios activos de 30</th><th scope="col">Reportes entregados</th><th scope="col">Días de preparación</th></tr></thead>
        <tbody>{CS_CASE_METRICS.map(row => <tr key={row.week}><th scope="row">{row.week}</th><td>{row.activeUsers}</td><td>{row.reportsDelivered}</td><td>{row.preparationDays}</td></tr>)}</tbody>
      </table></div>
      <p>Una observación por semana. La última semana incluye depuración de una muestra; falta comprobar que la mejora sea sostenida y que los periodos sean comparables.</p>
    </details>
    <nav aria-label="Etapas del caso Customer Success" className="lab-actions">
      {CS_CASE_STAGES.map((item, index) => <button type="button" className="btn secondary" key={item.key}
        aria-pressed={index === stageIndex} onClick={() => setStageIndex(index)}>{item.title}</button>)}
    </nav>
    <section aria-labelledby="cs-case-stage-title">
      <h4 id="cs-case-stage-title">{stage.title}</h4>
      <p><b>Objetivo:</b> {stage.goal}</p><p><b>Contexto:</b> {stage.context}</p>
      <p><b>Tu actividad:</b> {stage.task}</p>
      <fieldset><legend>Elige una decisión y examina su consecuencia</legend>
        {stage.choices.map(choice => <label className="lab-option" key={choice.key}>
          <input type="radio" name="cs-case-decision" checked={decisions[stage.key] === choice.key}
            onChange={() => setDecisions(previous => ({ ...previous, [stage.key]: choice.key }))} />{choice.label}
        </label>)}
      </fieldset>
      {feedback && <p role="status" aria-live="polite"><b>Consecuencia:</b> {feedback}</p>}
      <details><summary>Plantilla de entrega y ejemplo comentado</summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{stage.template}</pre>
        <p><b>Ejemplo posible, no respuesta única:</b> {stage.example}</p>
      </details>
      <label htmlFor="cs-case-draft">Tu borrador ficticio (opcional, hasta 4,000 caracteres)</label>
      <textarea id="cs-case-draft" rows={6} maxLength={4000} value={drafts[stage.key] ?? ""}
        aria-describedby="cs-case-draft-help" onChange={event => setDrafts(previous => ({ ...previous, [stage.key]: event.target.value.slice(0, 4000) }))} />
      <p id="cs-case-draft-help" className="muted">Copia tu trabajo antes de salir si quieres conservarlo. No ingreses nombres, correos, tokens ni información de clientes reales.</p>
      <h4>Revisa tu entrega</h4><ul>{stage.review.map(item => <li key={item}>{item}</li>)}</ul>
      <p>Identifica qué evidencia falta y prueba otra decisión. Esta revisión es orientativa y no califica automáticamente el borrador.</p>
    </section>
  </details></LocalizedContent>;
}


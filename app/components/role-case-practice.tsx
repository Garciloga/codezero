"use client";
import LocalizedContent from "./localization/client";

import {useState} from 'react';
import {ROLE_CASES, CASE_RUBRIC, roleReviewGuide} from '../../lib/role-practice-cases';
import {ROLE_WORKFLOWS} from '../../lib/career-role-workflows';
import type {CareerPositionKey} from '../../lib/career-guidance';
import {TARGET_ROLES} from '../../lib/practice-learning';
export default function RoleCasePractice(){
 const [role,setRole]=useState<string>('technical_cs');const [position,setPosition]=useState<CareerPositionKey>('customer_success');
 const [caseId,setCaseId]=useState<string>(ROLE_CASES[0].id);const [choice,setChoice]=useState<number|null>(null);const [reviewed,setReviewed]=useState(false);
 const active=ROLE_CASES.find(x=>x.id===caseId)!;const guide=roleReviewGuide(position);
 function selectCase(id:string){setCaseId(id);setChoice(null);setReviewed(false);}
 return <LocalizedContent><section id="role-cases" className="card"><span className="pill">CASOS DE TRABAJO</span><h2>Decisiones con consecuencias</h2><p>Casos originales con datos ficticios. Practica un proceso completo y prepara evidencia; no modifica tu avance oficial.</p>
 <label htmlFor="role-case-role">Puesto del caso</label>{' '}<select id="role-case-role" value={role} onChange={event=>{setRole(event.target.value);selectCase(ROLE_CASES.find(x=>x.role===event.target.value)!.id);}}>{TARGET_ROLES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select>{' '}
 <label htmlFor="role-case-id">Caso</label>{' '}<select id="role-case-id" value={caseId} onChange={event=>selectCase(event.target.value)}>{ROLE_CASES.filter(x=>x.role===role).map(x=><option key={x.id} value={x.id}>{x.stage} · {x.title}</option>)}</select>
 <h3>{active.title}</h3><p>{active.facts}</p><fieldset><legend>¿Cómo actuarías primero?</legend>{active.options.map((text,i)=><label key={text} style={{display:'block',margin:'12px 0'}}><input type="radio" name="case-choice" checked={choice===i} onChange={()=>{setChoice(i);setReviewed(false);}}/>{' '}{text}</label>)}</fieldset>
 <button type="button" className="btn" disabled={choice===null} onClick={()=>setReviewed(true)}>Explorar la consecuencia</button>
 {reviewed && <div role="status"><h3>{choice===active.recommended?'Una decisión respaldada por el caso':'Esta decisión deja un riesgo sin resolver'}</h3><p>{active.feedback}</p><h4>Prepara tu entrega</h4><ul>{active.deliverables.map(x=><li key={x}>{x}</li>)}</ul><p><b>Variante:</b> {active.failure} Explica qué cambiarías y cómo verificarías el resultado.</p></div>}
 <details><summary>Rúbrica para revisar el proceso</summary><p>Guía para revisión humana; no asigna una nota automática.</p><div style={{overflowX:'auto'}}><table className="review-table"><thead><tr><th scope="col">Criterio</th><th scope="col">Por reforzar</th><th scope="col">En desarrollo</th><th scope="col">Evidencia sólida</th></tr></thead><tbody>{CASE_RUBRIC.map(x=><tr key={x.key}><th scope="row">{x.label}</th><td>{x.missing}</td><td>{x.developing}</td><td>{x.ready}</td></tr>)}</tbody></table></div></details>
 <h3>Proceso y entregables de las posiciones actuales</h3><label>Posición <select value={position} onChange={event=>setPosition(event.target.value as CareerPositionKey)}>{Object.entries(ROLE_WORKFLOWS).map(([key,x])=><option key={key} value={key}>{x.title}</option>)}</select></label><p>{guide.process}</p><ul>{guide.activities.map(x=><li key={x}>{x}</li>)}</ul><h4>{guide.deliverable}</h4><ol>{guide.checklist.map(x=><li key={x}>{x}</li>)}</ol><p><b>Decisión:</b> {guide.decision}</p><p><b>Aceptación:</b> {guide.acceptance}</p><a href={guide.source} target="_blank" rel="noopener noreferrer">Referencia primaria del proceso</a>
 </section></LocalizedContent>;
}


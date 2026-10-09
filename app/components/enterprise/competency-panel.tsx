import {createServerSupabase} from '../../../lib/supabase-server';
import type {DevelopmentPlan} from '../../../lib/development-plan';
import LocalizedContent from '../localization/server';
import {COMPETENCIES,LEVEL_LABELS,competencyProfile,type CompetencyEvidence,type JobProfile} from '../../../lib/competency-matrix';
import {TRAINING_NOTICE,suggestedUnits} from '../../../lib/role-training-content';
import Link from 'next/link';
function EvidenceReferences({records}:{records:CompetencyEvidence[]}){
 return <LocalizedContent>{records.length?<ul>{records.slice(0,3).map(e=><li key={e.id}><a href={'#evidence-'+e.id}>{e.activity_key} · {e.observed_at.slice(0,10)} · {e.approval_submission_id?'Flujo configurado':e.review_source}</a></li>)}</ul>:<p>Sin registros para esta competencia.</p>}</LocalizedContent>;
}
export default async function CompetencyPanel({evidence,profile,org,userId,canAssign=false}:{evidence:CompetencyEvidence[];profile:JobProfile|null;org:string|null;userId:string;canAssign?:boolean}){
 const s=competencyProfile(evidence,profile);
 const plans=org?await (await createServerSupabase()).from('learning_development_plans').select('goals,due_at,state').eq('organization_id',org).eq('user_id',userId):null;
 if(plans?.error)throw Error('DEVELOPMENT_PLAN_UNAVAILABLE');
 const activeGoals=(plans?.data??[]).filter(p=>Date.parse(p.due_at)>=Date.now()).flatMap(p=>(p.goals as DevelopmentPlan['goals']));
 const errors=new Map<string,Set<string>>();for(const e of evidence)for(const error of e.critical_errors){if(!errors.has(error))errors.set(error,new Set());errors.get(error)!.add(e.independent_key);}
 return <LocalizedContent><section className="card training-competency-panel">
  <h2>Competencias por evidencia</h2><p role="note">{TRAINING_NOTICE}</p>
  <p>{profile?`Perfil esperado: ${profile.position_key} · versión ${profile.version}`:'Elige un puesto de aprendizaje para comparar brechas. No concede permisos de organización.'}</p>
  <div className="vivo-table-scroll" tabIndex={0} role="region" aria-label="Competencias por evidencia"><table><caption>Niveles demostrados, separados de las calificaciones históricas</caption><thead><tr><th>Competencia</th><th>Nivel validado</th><th>Autoevaluación provisional</th><th>Esperado</th><th>Evidencias</th><th>Rúbrica ponderada</th><th>Tendencia 90 días</th></tr></thead><tbody>{s.competencies.map(c=><tr key={c.key}><th scope="row">{c.name}{activeGoals.some(g=>g.key===c.key)&&<span className="pill">Objetivo activo</span>}</th><td>{c.level} · {c.label}</td><td>{c.provisional>c.level?LEVEL_LABELS[c.provisional]:'—'}</td><td>{c.expected??'Sin perfil'}{c.weight&&` · ${({high:'Alto',medium:'Medio',low:'Bajo'})[c.weight]}`}</td><td>{c.count}</td><td>{c.weightedScore===null?"Sin datos":`${c.weightedScore}/4`}</td><td>{c.trend90===null?'Datos insuficientes':`${c.trend90>0?'+':''}${c.trend90} puntos de rúbrica`}</td></tr>)}</tbody></table></div>
  <p>La rúbrica ponderada da doble peso a los últimos 90 días. El nivel exige además evidencia de autonomía y revisión humana; una media no sustituye esas comprobaciones.</p><h3>Fortalezas con evidencia</h3>{s.strengths.length?<ul>{s.strengths.map(c=><li key={c.key}>{c.name} · nivel {c.level} · {c.count} evidencias independientes<EvidenceReferences records={c.evidence}/></li>)}</ul>:<p>Aún no hay evidencia suficiente para señalar fortalezas validadas.</p>}
  <h3>Brechas y refuerzo</h3>{s.gaps.length?s.gaps.map(c=><div key={c.key}><h4>{c.name}</h4><p>Actual {c.level}; esperado {c.expected}. {c.count<3?'Faltan evidencias; esto no demuestra falta de habilidad.':''}</p>
   <EvidenceReferences records={c.evidence}/><ul>{suggestedUnits(c.key).map(u=><li key={u.key}><Link prefetch={false} href={'/role-training?'+(org?'organization_id='+org+'&':'')+'activity='+u.key}>{u.title}</Link></li>)}</ul>
   {canAssign&&org&&<form action="/api/role-training" method="post"><input type="hidden" name="action" value="reinforce"/><input type="hidden" name="organization_id" value={org}/><input type="hidden" name="user_id" value={userId}/><fieldset><legend>Asigna de una a tres unidades</legend>{suggestedUnits(c.key).map(u=><label key={u.key} style={{display:'block'}}><input type="checkbox" name="units" value={u.key}/>{u.title}</label>)}</fieldset><label>Fecha de entrega<input name="due_at" type="date" required/></label><button className="btn">Asignar refuerzo</button><p>Se guarda el nivel anterior y la comparación después de revisión humana.</p></form>}
  </div>):<p>No hay brechas calculables con el perfil y las evidencias disponibles.</p>}
  <h3>Preguntas para el 1:1</h3><ol>{s.questions.map(q=><li key={q}>{q}</li>)}</ol>
  <h3>Criterio profesional: errores críticos registrados</h3>{errors.size?<ul>{[...errors].map(([key,activities])=><li key={key}>{key} · {activities.size} actividades con registro. Revisa abajo el historial y las correcciones.</li>)}</ul>:<p>Sin errores críticos registrados. Esto no acredita desempeño laboral real.</p>}
  <details><summary>Evidencias e historial de revisión</summary>{evidence.length?<ul>{[...evidence].sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)).map(e=><li key={e.id} id={'evidence-'+e.id}><strong>{e.activity_key}</strong> · {e.approval_submission_id?'Flujo configurado':e.review_source} · <time dateTime={e.observed_at}>{e.observed_at.slice(0,10)}</time><p>{Object.entries(e.competency_scores).map(([key,value])=>`${COMPETENCIES[key as keyof typeof COMPETENCIES]}: ${value}/4`).join(' · ')}</p>{e.feedback&&<p translate="no">{e.feedback}</p>}{e.critical_errors.length>0&&<p>Errores: {e.critical_errors.join(', ')}</p>}</li>)}</ul>:<p>Sin evidencia registrada.</p>}</details>
 </section></LocalizedContent>;
}


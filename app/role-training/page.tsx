import {notFound,redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {roleTrainingEnabled,roleTrainingSession,trainingPerson} from '../../lib/role-training-server';
import {hasCustomerSuccessCourse} from '../../lib/customer-success-course';
import {TRAINING_UNITS,TRAINING_EXTRAS,TRAINING_NOTICE,FARO_DATA,TECHNICAL_BORROWING} from '../../lib/role-training-content';
import {COMPETENCIES} from '../../lib/competency-matrix';
import {ROLE_WORKFLOWS} from '../../lib/career-role-workflows';
import {isUuid} from '../../lib/workspace-sandbox';
import ProjectReviewProgress from '../components/enterprise/project-review-progress';
import {readWorkspacePages} from '../../lib/workspace-pages';
import type {ReviewRun,ReviewVote} from '../../lib/project-review-flow';
import CompetencyPanel from '../components/enterprise/competency-panel';
import ReinforcementPanel from '../components/enterprise/reinforcement-panel';
export default async function RoleTraining({searchParams}:{searchParams:Promise<{organization_id?:string;activity?:string;result?:string}>}){
 if(!roleTrainingEnabled())notFound();const session=await roleTrainingSession();if(!session)redirect('/login');
 const params=await searchParams,org=params.organization_id??null;
 if(org&&!isUuid(org))notFound();
 if(org){const {data:m}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).maybeSingle();if(!m)notFound();}
 const p=await trainingPerson(session.user.id,org);if(!p)notFound();
 const availableCS=hasCustomerSuccessCourse(session.profile);
 const diploma=params.result==='diploma'?await session.supabase.from('certificates').select('id,title,issued_at').eq('user_id',session.user.id).eq('certificate_type','customer-success-v2').maybeSingle():null;
 if(diploma?.error)throw Error('TRAINING_DATA_UNAVAILABLE');
 const visible=[...TRAINING_UNITS,...TRAINING_EXTRAS].filter(a=>availableCS||a.route==='common');
 const activities=params.activity?visible.filter(a=>a.key===params.activity):visible.slice(0,1);
 if(params.activity&&!activities.length)notFound();
 const reinforcement=org?await session.supabase.from('learning_assignments').select('activity_key,title,due_at,reinforcement_before,reinforcement_after').eq('organization_id',org).eq('user_id',session.user.id).eq('activity_type','route_unit'):null;
 const {data:submissions,error:submissionsError}=await session.supabase.from('learning_practice_submissions').select('id,activity_id,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(1000);
 if(submissionsError)throw Error('TRAINING_DATA_UNAVAILABLE');
 const [runs,votes]=await Promise.all([
 readWorkspacePages<ReviewRun>((a,b)=>{let q=session.supabase.from('learning_project_review_runs').select('*').eq('learner_id',session.user.id);if(org)q=q.eq('organization_id',org);return q.order('created_at').order('submission_id').range(a,b);}),
 readWorkspacePages<ReviewVote>((a,b)=>{let q=session.supabase.from('learning_project_review_votes').select('id,submission_id,stage_index,user_id,decision,feedback,observed_at').eq('learner_id',session.user.id);if(org)q=q.eq('organization_id',org);return q.order('observed_at').order('id').range(a,b);})]);
 if(runs.error||votes.error)throw Error('PROJECT_APPROVAL_UNAVAILABLE');
 return <main className="wrap" lang="es-MX" translate="no"><h1>Formación por puesto · piloto</h1><p>{TRAINING_NOTICE}</p><p>Tronco común: 9 unidades, 45 h estimadas. Customer Success: 20 unidades y actividades integradoras, 120 h adicionales. Las horas incluyen trabajo independiente; no son horas de video ni una acreditación profesional.</p>
 {params.result&&<p role="status">{diploma?.data?'Diploma de ruta registrado en tus certificados.':'Cambios guardados. La autoevaluación permanece provisional hasta revisión.'}</p>}
 {diploma?.data&&<section className="card"><h2>{diploma.data.title}</h2><p>Constancia de práctica simulada · emitida {diploma.data.issued_at.slice(0,10)} · ID {diploma.data.id}</p></section>}
 <nav aria-label="Ruta piloto"><Link href={'/role-training'+(org?'?organization_id='+org:'')}>Todas las actividades</Link> · <Link href="/customer-success">Curso CS existente</Link>{org&&<> · <Link href={`/teams/${org}`}>Mi equipo</Link></>}</nav>
 <section className="card"><h2>Puesto de aprendizaje</h2><form action="/api/role-training" method="post"><input type="hidden" name="action" value="position"/>{org&&<input type="hidden" name="organization_id" value={org}/>}<label>Puesto<select name="position" defaultValue={p.profile?.position_key??''} required><option value="" disabled>Selecciona un puesto</option>{Object.entries(ROLE_WORKFLOWS).map(([key,role])=><option key={key} value={key}>{role.title}</option>)}</select></label><button className="btn">Guardar puesto</button></form><p>Este puesto define comparación de competencias; no cambia permisos, plan ni derechos.</p></section>
 {org&&<p><Link href={`/role-training/review?organization_id=${org}`}>Proyectos que me asignaron para revisar</Link></p>}
 <ProjectReviewProgress runs={runs.data??[]} votes={votes.data??[]}/>
 <CompetencyPanel evidence={p.evidence} profile={p.profile} org={org} userId={session.user.id}/>
 {reinforcement&&!reinforcement.error&&<ReinforcementPanel records={reinforcement.data??[]}/>}
 <section className="card"><h2>Contenido y actividades de la ruta</h2>{['Tronco común','Fundamentos','Operación','Dominio','Especialista'].map((name,level)=><details key={level} open={level===0}><summary>{name}</summary><ul>{visible.filter(a=>a.level===level).map(a=><li key={a.key}><Link prefetch={false} href={'/role-training?'+(org?'organization_id='+org+'&':'')+'activity='+a.key}>{a.title}</Link> · {a.hours} h estimadas</li>)}</ul></details>)}</section>
 {!availableCS&&<p>La ruta CS conserva acceso Pro/Enterprise; el tronco común está disponible para practicar.</p>}
 <section className="card"><h2>Cuenta Faro · dataset canónico</h2><table><caption>Datos ficticios reutilizados del curso actual</caption><thead><tr><th>Semana</th><th>Usuarios activos</th><th>Días de preparación</th></tr></thead><tbody>{FARO_DATA.map(r=><tr key={r.week}><td>{r.week}</td><td>{r.activeUsers}</td><td>{r.preparationDays}</td></tr>)}</tbody></table></section>
 {activities.map(a=><section className="card" key={a.key} id={a.key} style={{marginTop:20}}><h2>{a.title}</h2><p>{a.route==='common'?'Tronco común':`Customer Success · nivel ${a.level}`} · {a.hours} h estimadas · {a.kind}</p><p>Competencias: {a.competencies.map(k=>COMPETENCIES[k]).join(' · ')}</p><h3>Lección</h3><p>{a.lesson}</p><h3>Práctica y entregable</h3><p>{a.task}</p>
  {a.sourceRubric&&<details><summary>Criterios canónicos de Cuenta Faro</summary><ul>{a.sourceRubric.map(r=><li key={r}>{r}</li>)}</ul><p>La revisión nueva registra cada competencia en escala 0–4; no convierte automáticamente la nota del caso existente.</p></details>}
  {a.sourceStage&&<p>Episodio reutilizado de Cuenta Faro: {a.sourceStage}.</p>}
  <form action="/api/role-training" method="post"><input type="hidden" name="action" value="submit"/><input type="hidden" name="activity" value={a.key}/><input type="hidden" name="request_id" value={randomUUID()}/>{org&&<input type="hidden" name="organization_id" value={org}/>} {a.kind==='exercise'&&<input type="hidden" name="assistance" value="recognition"/>}
   {a.decisions.map((q,i)=><fieldset key={i}><legend>{i+1}. {q.prompt}</legend>{q.options.map((option,n)=><label key={n} style={{display:'block'}}><input type="radio" name={'decision_'+i} value={n} required/>{option}</label>)}</fieldset>)}
   {a.kind!=='exercise'&&<><label>Tu entregable, con datos ficticios<textarea name="draft" rows={9} minLength={120} maxLength={24000} placeholder={a.template} required/></label><label>Apoyo usado<select name="assistance" defaultValue="guided"><option value="guided">Con guía o ejemplo</option><option value="independent">Sin guía ni ejemplo</option></select></label><fieldset><legend>Autoevaluación guiada por competencia (no es aprobación humana)</legend>{a.competencies.map(k=><label key={k}>{COMPETENCIES[k]}<select name={'score_'+k} required defaultValue=""><option value="" disabled>Revisa la rúbrica</option>{[0,1,2,3,4].map(v=><option key={v} value={v}>{v}/4</option>)}</select></label>)}</fieldset><ul>{a.rubric.map(r=><li key={r}>{r}</li>)}</ul></>}
   {a.reevaluationOf&&<label>Evidencia previa revisada (mínimo 30 días)<select name="reevaluation_of" required defaultValue=""><option value="" disabled>Elige una evidencia elegible</option>{p.evidence.filter(e=>e.activity_key===a.reevaluationOf&&['manager','admin'].includes(e.review_source)&&e.assistance==='independent'&&!e.critical_errors.length&&Date.now()-Date.parse(e.observed_at)>=30*86400000).map(e=><option key={e.id} value={e.id}>{e.activity_key} · {e.observed_at.slice(0,10)}</option>)}</select></label>}
   <button className="btn">{a.kind==='project'||a.kind==='capstone'?'Enviar para revisión humana':a.kind==='exercise'?'Enviar evaluación':'Guardar práctica y autoevaluación'}</button><p>Actividades obligatorias incluidas en el piloto; no consumen cuota de proyectos. Reenviar la misma solicitud no duplica evidencia.</p>
  </form>
  <details><summary>Ejemplo y feedback para estudiar después de responder</summary><p>{a.example}</p><ul>{a.decisions.map((q,i)=><li key={i}>{q.feedback}</li>)}</ul></details>
  {a.optionalPractice.length>0&&<><h3>Transferencia y contraste</h3><ol>{a.optionalPractice.map(t=><li key={t}>{t}</li>)}</ol></>}
  <h3>Lectura de referencia</h3><ul>{a.sourceUrls.map(url=><li key={url}><a href={url} target="_blank" rel="noreferrer">Manual de Customer Success · GitLab</a></li>)}</ul><p>Contrasta la referencia con tu entregable; las reglas de aprobación de este piloto están en su rúbrica.</p>
 </section>)}
 <section className="card"><h2>Apoyo técnico reutilizado</h2><ul>{TECHNICAL_BORROWING.map(x=><li key={x.topic}><Link href={`/learn/${x.level}`}>{x.topic}</Link>: {x.purpose}</li>)}</ul></section>
 <section className="card"><h2>Diploma de ruta ampliada</h2><p>Requiere capstone aprobado por Admin y nivel 3 validado en las competencias de peso Alto de Customer Success. La elegibilidad se comprueba en servidor; no depende de tu autoevaluación.</p>{availableCS&&<form action="/api/role-training" method="post"><input type="hidden" name="action" value="diploma"/>{org&&<input type="hidden" name="organization_id" value={org}/>}<button className="btn">Comprobar requisitos y emitir diploma incluido</button></form>}<p>Las constancias existentes siguen vigentes. El envío de una actividad no emite un diploma.</p></section>
 <p>{submissions?.length??0} entregas registradas en tu historial.</p>
 </main>;
}

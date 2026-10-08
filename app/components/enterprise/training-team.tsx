import Link from 'next/link';
import {roleTrainingSession} from '../../../lib/role-training-server';
import {readWorkspacePages} from '../../../lib/workspace-pages';
import {COMPETENCIES,competencyProfile,type CompetencyEvidence,type JobProfile,type CompetencyKey} from '../../../lib/competency-matrix';
import {TRAINING_NOTICE} from '../../../lib/role-training-content';
import type {Member} from '../../../lib/organization-metrics';
export default async function TrainingTeam({org,people}:{org:string;people:Member[]}){
 const session=await roleTrainingSession();if(!session)return null;
 const [history,positions,profiles]=await Promise.all([
  readWorkspacePages<CompetencyEvidence>((a,b)=>session.supabase.from('learning_evidence_history').select('id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,observed_at,reevaluation_of,critical_errors,feedback,approval_submission_id').eq('organization_id',org).order('user_id').order('observed_at').order('id').range(a,b)),
  readWorkspacePages<{user_id:string;learning_position_key:string|null}>((a,b)=>session.supabase.from('organization_memberships').select('user_id,learning_position_key').eq('organization_id',org).eq('active',true).order('user_id').range(a,b)),
  readWorkspacePages<JobProfile>((a,b)=>session.supabase.from('learning_job_profiles').select('position_key,version,weights,expected').order('version',{ascending:false}).order('position_key').range(a,b)),
 ]);
 if(history.error||positions.error||profiles.error)throw Error('TRAINING_MAP_UNAVAILABLE');
 const rows=[...people].sort((a,b)=>a.display_name.localeCompare(b.display_name)).map(person=>{
  const key=positions.data?.find(p=>p.user_id===person.user_id)?.learning_position_key;
  const profile=profiles.data?.find(p=>p.position_key===key) as JobProfile|undefined;
  return {...person,summary:competencyProfile((history.data??[]).filter(e=>e.user_id===person.user_id),profile??null)};
 });
 const gaps=Object.keys(COMPETENCIES).map(key=>({key:key as CompetencyKey,count:rows.filter(r=>r.summary.competencies.some(c=>c.key===key&&c.count>=3&&c.expected!==null&&c.level<c.expected)).length})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
 const common=gaps[0]?.count?gaps[0]:null;
 const mentors=common?rows.filter(r=>r.summary.competencies.some(c=>c.key===common.key&&c.level>=3&&c.count>=3)):[];
 return <section className="card" lang="es-MX" translate="no"><h2>Mapa del equipo · competencias 0–4</h2><p>{TRAINING_NOTICE}</p><p>Personas en orden alfabético. “Sin evidencia” no demuestra falta de habilidad. Los mentores son candidatos por práctica validada; su participación requiere acuerdo.</p>
 <div className="vivo-table-scroll"><table><caption>Comparación con el perfil de aprendizaje del puesto</caption><thead><tr><th>Persona</th>{Object.values(COMPETENCIES).map(name=><th key={name}>{name}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.user_id}><th scope="row"><Link href={`/teams/${org}/person/${r.user_id}`}>{r.display_name}</Link></th>{r.summary.competencies.map(c=><td key={c.key}>{c.level} / {c.expected??'—'}<br/>{c.count<3?'Sin evidencia suficiente':c.label}</td>)}</tr>)}</tbody></table></div>
 <p>{common?`Brecha más común entre personas con evidencia: ${COMPETENCIES[common.key]} (${common.count} personas).`:'Aún no hay evidencia suficiente para identificar una brecha común.'}</p>
 <p>Posibles mentores internos para esa brecha: {mentors.length?mentors.map(m=>m.display_name).join(', '):'sin candidatos demostrados en tu alcance.'}</p>
 <Link className="btn secondary" href={`/role-training/review?organization_id=${org}`}>Revisar entregables y proyectos del equipo</Link>
 <p><Link href={`/role-training/approval-flow?organization_id=${org}`}>Configurar aprobación opcional de proyectos</Link></p>
 </section>;
}

import LocalizedContent from '../localization/server';
import MixedLevels from './mixed-levels';
import Link from 'next/link';
import {mixedReleaseEnabled} from '../../../lib/mixed-role-server';
import {roleTrainingSession} from '../../../lib/role-training-server';
import {readWorkspacePages} from '../../../lib/workspace-pages';
import {mixedLevels,mixedTeamLevels,lowestSupportedType,WORK_TYPE_NAMES,WORK_TYPES} from '../../../lib/mixed-role-model';
import {MIXED_UNITS} from '../../../lib/mixed-role-content';
import type {CompetencyEvidence,JobProfile} from '../../../lib/competency-matrix';
import type {Member} from '../../../lib/organization-metrics';
export default async function MixedTeam({org,people}:{org:string;people:Member[]}){
 if(!await mixedReleaseEnabled())return null;const session=await roleTrainingSession();if(!session)return null;
 const [history,positions,profiles]=await Promise.all([
 readWorkspacePages<CompetencyEvidence>((a,b)=>session.supabase.from('learning_evidence_history').select('id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,observed_at,reevaluation_of,critical_errors').eq('organization_id',org).order('id').range(a,b)),
 readWorkspacePages<{user_id:string;learning_position_key:string|null}>((a,b)=>session.supabase.from('organization_memberships').select('user_id,learning_position_key').eq('organization_id',org).eq('active',true).order('user_id').range(a,b)),
 readWorkspacePages<JobProfile>((a,b)=>session.supabase.from('learning_job_profiles').select('position_key,version,weights,expected').order('version',{ascending:false}).order('position_key').range(a,b)),
 ]);
 if(history.error||positions.error||profiles.error)throw Error('MIXED_TEAM_UNAVAILABLE');
 const rows=[...people].sort((a,b)=>a.display_name.localeCompare(b.display_name)).map(person=>{const position=positions.data?.find(p=>p.user_id===person.user_id)?.learning_position_key;const profile=profiles.data?.find(p=>p.position_key===position)??null;return {...person,position,levels:mixedLevels((history.data??[]).filter(e=>e.user_id===person.user_id),profile)};});
 const teamLevels=mixedTeamLevels(rows.map(r=>r.levels));
 const ranked=teamLevels.filter(r=>r.level!==null&&r.withEvidence>0);const minimum=ranked.length?Math.min(...ranked.map(r=>r.level!)):null;
 const lowest=ranked.filter(r=>r.level===minimum);
 return <LocalizedContent><section className="card"><h2>Avance por tipo de trabajo</h2><p>Solo las personas dentro de tu alcance. Los niveles usan la misma matriz de competencias de cada ficha.</p><MixedLevels levels={teamLevels}/>{lowest.length>0&&<p><strong>Tipo más bajo del equipo</strong>: {lowest.map(r=>WORK_TYPE_NAMES[r.type]).join(' · ')} · {minimum} / 4</p>}{teamLevels.some(r=>r.withEvidence<r.people)&&<p>Promedio provisional: faltan evidencias suficientes de algunas personas. Revisa la tabla antes de asignar refuerzo.</p>}<div className="vivo-table-scroll"><table><caption>Niveles validados y refuerzo sugerido</caption><thead><tr><th>Persona</th>{WORK_TYPES.map(type=><th key={type}>{WORK_TYPE_NAMES[type]}</th>)}<th>Reforzar</th></tr></thead><tbody>{rows.map(row=><tr key={row.user_id}><th scope="row"><Link prefetch={false} href={'/teams/'+org+'/person/'+row.user_id}>{row.display_name}</Link></th>{row.levels.map(level=><td key={level.type}>{level.level} / 4<br/>{!level.supported?'Sin evidencia suficiente':null}</td>)}<td>{lowestSupportedType(row.levels).map(type=><span key={type}>{WORK_TYPE_NAMES[type]} · </span>)}{!lowestSupportedType(row.levels).length?'Sin evidencia suficiente':null}</td></tr>)}</tbody></table></div>
 <p>Asigna refuerzos con responsable, fecha y seguimiento. La recomendación no asigna trabajo automáticamente.</p><Link prefetch={false} className="btn secondary" href={'/teams/'+org+'/assign'}>Asignar aprendizaje</Link><p>{MIXED_UNITS.length} · 8</p></section></LocalizedContent>;
}

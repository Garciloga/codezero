import LocalizedContent from '../../components/localization/server';
import {notFound,redirect} from 'next/navigation';
import {roleTrainingEnabled,roleTrainingSession} from '../../../lib/role-training-server';
import {COMPETENCIES,type JobProfile} from '../../../lib/competency-matrix';
import {readWorkspacePages} from '../../../lib/workspace-pages';
import {ROLE_WORKFLOWS} from '../../../lib/career-role-workflows';
export default async function TrainingProfiles(){
 if(!roleTrainingEnabled())notFound();const session=await roleTrainingSession();if(!session)redirect('/login');if(session.profile.role!=='owner')notFound();
 const {data,error}=await readWorkspacePages<JobProfile>((a,b)=>session.supabase.from('learning_job_profiles').select('position_key,version,weights,expected').order('version',{ascending:false}).order('position_key').range(a,b));if(error)throw Error('PROFILE_DATA_UNAVAILABLE');
 const seen=new Set<string>();const profiles=(data as JobProfile[]).filter(p=>{if(seen.has(p.position_key))return false;seen.add(p.position_key);return true;});
 return <LocalizedContent><main className="wrap"><h1>Perfiles de competencia por puesto</h1><p>Pesos y niveles esperados configurables. Guardar agrega una versión; no cambia afinidad, scoring de misiones ni permisos.</p>{profiles.map(p=><section className="card" key={p.position_key}><h2>{ROLE_WORKFLOWS[p.position_key as keyof typeof ROLE_WORKFLOWS]?.title??p.position_key}</h2><p>Versión {p.version}</p><form action="/api/role-training" method="post"><input type="hidden" name="action" value="profile"/><input type="hidden" name="position" value={p.position_key}/><input type="hidden" name="version" value={p.version}/>{Object.entries(COMPETENCIES).map(([k,name])=><fieldset key={k}><legend>{name}</legend><label>Peso<select name={'weight_'+k} defaultValue={p.weights[k as keyof typeof COMPETENCIES]}><option value="high">Alto</option><option value="medium">Medio</option><option value="low">Bajo</option></select></label><label>Nivel esperado<input name={'expected_'+k} type="number" min={0} max={4} required defaultValue={p.expected[k as keyof typeof COMPETENCIES]}/></label></fieldset>)}<button className="btn">Guardar nueva versión</button></form></section>)}</main></LocalizedContent>;
}

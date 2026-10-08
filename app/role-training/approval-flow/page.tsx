import LocalizedContent from '../../components/localization/server';
import {notFound,redirect} from 'next/navigation';
import Link from 'next/link';
import {roleTrainingEnabled,roleTrainingSession} from '../../../lib/role-training-server';
import {readWorkspacePages} from '../../../lib/workspace-pages';
import {isUuid} from '../../../lib/workspace-sandbox';
import {ROLE_WORKFLOWS} from '../../../lib/career-role-workflows';
import {TRAINING_NOTICE} from '../../../lib/role-training-content';
import type {ReviewFlow,ReviewPerson} from '../../../lib/project-review-flow';
import FlowEditor from './editor';
export default async function ApprovalFlow({searchParams}:{searchParams:Promise<{organization_id?:string;flow?:string;saved?:string}>}){
 if(!roleTrainingEnabled())notFound();const session=await roleTrainingSession();if(!session)redirect('/login');
 const params=await searchParams,org=params.organization_id;if(!isUuid(org))notFound();
 const {data:member}=await session.supabase.from('organization_memberships').select('role').eq('organization_id',org).eq('user_id',session.user.id).eq('active',true).single();
 if(!member||!['owner','admin','manager','supervisor'].includes(member.role))notFound();
 const [flows,people]=await Promise.all([
 readWorkspacePages<ReviewFlow>((a,b)=>session.supabase.from('learning_project_review_flows').select('id,flow_key,version,name,enabled,priority,audience,stages,created_by').eq('organization_id',org).order('version',{ascending:false}).order('id').range(a,b)),
 readWorkspacePages<ReviewPerson>((a,b)=>session.supabase.from('organization_memberships').select('user_id,display_name,role,learning_position_key').eq('organization_id',org).eq('active',true).order('user_id').range(a,b))]);
 if(flows.error||people.error)throw Error('APPROVAL_CONFIG_UNAVAILABLE');
 const latest=(flows.data??[]).filter((f,i,list)=>list.findIndex(x=>x.flow_key===f.flow_key)===i),selected=params.flow?latest.find(f=>f.flow_key===params.flow):undefined;
 if(params.flow&&(!selected||selected.created_by!==session.user.id&&!['owner','admin'].includes(member.role)))notFound();
 return <LocalizedContent><main className="wrap"><h1>Aprobación opcional de proyectos</h1><p>{TRAINING_NOTICE}</p><p>Sin un flujo aplicable, supervisor o manager puede calificar directamente dentro de su alcance. Los capstones conservan revisión desde Administración.</p><Link href={`/teams/${org}`}>Volver al equipo</Link> · <Link href={`/role-training/review?organization_id=${org}`}>Revisar entregas</Link>{params.saved&&<p role="status">Versión guardada para nuevas entregas.</p>}<h2>Flujos existentes</h2><ul>{latest.map(f=><li key={f.flow_key}>{f.name} · v{f.version} · prioridad {f.priority} · {f.enabled?'activo':'inactivo'} {(f.created_by===session.user.id||['owner','admin'].includes(member.role))&&<Link href={`?organization_id=${org}&flow=${f.flow_key}`}>Editar</Link>}</li>)}</ul><Link href={`?organization_id=${org}`}>Crear otro flujo</Link><h2>{selected?'Editar con historial de versiones':'Nuevo flujo'}</h2><FlowEditor key={selected?.id??'new'} org={org} flow={selected} people={people.data??[]} positions={Object.entries(ROLE_WORKFLOWS).map(([key,r])=>({key,title:r.title}))}/></main></LocalizedContent>;
}
